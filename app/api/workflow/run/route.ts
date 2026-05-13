import type { WorkflowDataType } from "@/app/components/workflow/types";
import type {WorkflowTraceItem} from "@/app/components/workflow/nodes/execution-types";
import { runWorkflow } from "@/app/lib/workflow-runner";
import {saveWorkflowRun, updateWorkflowGraph} from "@/app/workflow/data";

export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const sendEvent = (controller: ReadableStreamDefaultController<Uint8Array>, event: string, data: unknown) => {
    controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let workflowId = "";
      let query = "";
      let startedAt = new Date().toISOString();
      let latestTrace: WorkflowTraceItem[] = [];
      let runInput: Record<string, unknown> = {};
      try {
        const formData = await request.formData();
        workflowId = String(formData.get("workflow_id") ?? "");
        const workflowRaw = formData.get("workflow");
        query = String(formData.get("query") ?? "");

        if (!workflowId) {
          sendEvent(controller, "workflow_error", {
            success: false,
            error: "Missing workflow_id.",
          });
          controller.close();
          return;
        }

        if (typeof workflowRaw !== "string") {
          sendEvent(controller, "workflow_error", {
            success: false,
            error: "Missing workflow payload.",
          });
          controller.close();
          return;
        }

        const workflow = JSON.parse(workflowRaw) as WorkflowDataType;
        const savedWorkflow = await updateWorkflowGraph(workflowId, workflow);
        if (!savedWorkflow) {
          sendEvent(controller, "workflow_error", {
            success: false,
            error: "Workflow not found.",
          });
          controller.close();
          return;
        }
        const files = await Promise.all(
          formData
            .getAll("files")
            .filter((entry): entry is File => entry instanceof File)
            .map(async (file) => {
              const isTextLike =
                file.type.startsWith("text/") ||
                /\.(md|mdx|txt|json|csv|tsv|js|ts|jsx|tsx|py|java|go|rs|swift|yaml|yml|xml|html|css)$/i.test(file.name);

              return {
                name: file.name,
                type: file.type,
                size: file.size,
                text: isTextLike ? await file.text() : undefined,
              };
            }),
        );

        sendEvent(controller, "workflow_started", { success: true });
        startedAt = new Date().toISOString();
        runInput = {
          query,
          files: files.map((file) => ({
            name: file.name,
            type: file.type,
            size: file.size,
          })),
        };

        const result = await runWorkflow(
          workflow,
          {
            query,
            files,
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

        await saveWorkflowRun({
          workflow_id: workflowId,
          status: "completed",
          query,
          input: runInput,
          result: result as unknown as Record<string, unknown>,
          trace: result.trace,
          started_at: startedAt,
          finished_at: new Date().toISOString(),
        });

        controller.close();
      } catch (error) {
        if (workflowId) {
          await saveWorkflowRun({
            workflow_id: workflowId,
            status: "failed",
            query,
            input: runInput,
            result: null,
            trace: latestTrace,
            error: error instanceof Error ? error.message : "Workflow execution failed.",
            started_at: startedAt,
            finished_at: new Date().toISOString(),
          }).catch(() => {});
        }
        sendEvent(controller, "workflow_error", {
          success: false,
          error: error instanceof Error ? error.message : "Workflow execution failed.",
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
