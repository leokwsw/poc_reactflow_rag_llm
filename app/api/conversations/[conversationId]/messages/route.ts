import {NextResponse} from "next/server";
import {
  createConversationMessage,
  getConversationById,
  getConversationHistory,
  listConversationMessages,
  maybeTitleConversationFromFirstMessage,
  updateConversationMessage,
} from "@/app/chat/data";
import type {WorkflowTraceItem} from "@/app/components/workflow/nodes/execution-types";
import {runWorkflow} from "@/app/lib/workflow-runner";
import {getWorkflowById, saveWorkflowRun} from "@/app/workflow/data";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    conversationId: string;
  }>;
};

const outputTextFromResult = (value: unknown) => {
  if (!value || typeof value !== "object") return "";
  const result = value as {output?: unknown; result?: {output?: unknown}};
  if (typeof result.output === "string") return result.output;
  if (typeof result.result?.output === "string") return result.result.output;
  return "";
};

export async function GET(_request: Request, context: RouteContext) {
  const {conversationId} = await context.params;
  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    return NextResponse.json({error: "Conversation not found."}, {status: 404});
  }
  const messages = await listConversationMessages(conversationId, {includeRuns: true});
  return NextResponse.json({messages});
}

export async function POST(request: Request, context: RouteContext) {
  const {conversationId} = await context.params;
  const encoder = new TextEncoder();
  const sendEvent = (controller: ReadableStreamDefaultController<Uint8Array>, event: string, data: unknown) => {
    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let assistantMessageId = "";
      let latestTrace: WorkflowTraceItem[] = [];
      let query = "";
      let startedAt = new Date().toISOString();
      try {
        const conversation = await getConversationById(conversationId);
        if (!conversation) {
          sendEvent(controller, "workflow_error", {success: false, error: "Conversation not found."});
          controller.close();
          return;
        }

        const workflow = await getWorkflowById(conversation.workflow_id);
        if (!workflow) {
          sendEvent(controller, "workflow_error", {success: false, error: "Workflow not found."});
          controller.close();
          return;
        }

        const body = await request.json().catch(() => ({})) as {content?: unknown};
        query = typeof body.content === "string" ? body.content.trim() : "";
        if (!query) {
          sendEvent(controller, "workflow_error", {success: false, error: "Message content is required."});
          controller.close();
          return;
        }

        const history = await getConversationHistory(conversationId);
        const userMessage = await createConversationMessage({
          conversation_id: conversationId,
          role: "user",
          content: query,
          status: "completed",
        });
        await maybeTitleConversationFromFirstMessage(conversationId, query);
        const assistantMessage = await createConversationMessage({
          conversation_id: conversationId,
          role: "assistant",
          content: "",
          status: "pending",
          metadata: {events: []},
        });
        assistantMessageId = assistantMessage.id;

        sendEvent(controller, "chat_messages_created", {
          success: true,
          user_message: userMessage,
          assistant_message: assistantMessage,
        });
        sendEvent(controller, "workflow_started", {success: true});
        startedAt = new Date().toISOString();

        const result = await runWorkflow(
          workflow.graph,
          {
            query,
            files: [],
            conversation_history: history,
          },
          {
            onEvent(event) {
              if ("traceItem" in event) {
                const index = latestTrace.findIndex((item) => item.nodeId === event.traceItem.nodeId);
                latestTrace = index >= 0
                  ? latestTrace.map((item, itemIndex) => itemIndex === index ? event.traceItem : item)
                  : [...latestTrace, event.traceItem];
              }

              if (event.type === "workflow_completed") {
                sendEvent(controller, "workflow_completed", {
                  success: true,
                  result: event.result,
                });
                return;
              }

              sendEvent(controller, event.type, {
                success: true,
                ...event,
              });
            },
          },
        );

        const savedRun = await saveWorkflowRun({
          workflow_id: workflow.id,
          status: "completed",
          query,
          input: {
            query,
            conversation_id: conversationId,
            conversation_history: history,
            files: [],
          },
          result: result as unknown as Record<string, unknown>,
          trace: result.trace,
          started_at: startedAt,
          finished_at: new Date().toISOString(),
        });
        const updatedAssistant = await updateConversationMessage(assistantMessage.id, {
          content: result.output || outputTextFromResult(result) || "Workflow completed without a final answer.",
          status: "completed",
          workflow_run_id: savedRun.id,
          metadata: {
            output: result.output,
            outputs: result.outputs,
            trace_count: result.trace.length,
          },
        });

        sendEvent(controller, "chat_message_completed", {
          success: true,
          assistant_message: {
            ...updatedAssistant,
            workflow_run: savedRun,
          },
        });
        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : "Workflow execution failed.";
        let savedRunId: string | null = null;
        if (query) {
          const conversation = await getConversationById(conversationId).catch(() => undefined);
          if (conversation) {
            const savedRun = await saveWorkflowRun({
              workflow_id: conversation.workflow_id,
              status: "failed",
              query,
              input: {
                query,
                conversation_id: conversationId,
                files: [],
              },
              result: null,
              trace: latestTrace,
              error: message,
              started_at: startedAt,
              finished_at: new Date().toISOString(),
            }).catch(() => null);
            savedRunId = savedRun?.id ?? null;
          }
        }
        if (assistantMessageId) {
          await updateConversationMessage(assistantMessageId, {
            content: message,
            status: "failed",
            workflow_run_id: savedRunId,
            metadata: {error: message},
          }).catch(() => {});
        }
        sendEvent(controller, "workflow_error", {
          success: false,
          error: message,
          assistant_message_id: assistantMessageId || null,
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
