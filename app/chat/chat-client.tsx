"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {FormEvent, useMemo, useRef, useState} from "react";
import Markdown from "@/app/components/markdown";
import type {ConversationMessageRecord, ConversationRecord} from "@/app/chat/data";
import type {WorkflowRecord} from "@/app/workflow/data";

type ChatEvent = {
  event: string;
  data: unknown;
};

type ChatClientProps = {
  conversations: ConversationRecord[];
  initialMessages: ConversationMessageRecord[];
  selectedConversationId: string;
  workflows: WorkflowRecord[];
};

const parseSseChunk = (buffer: string) => {
  const events: ChatEvent[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    const eventLine = part.split("\n").find((line) => line.startsWith("event: "));
    const dataLine = part.split("\n").find((line) => line.startsWith("data: "));
    if (!eventLine || !dataLine) continue;

    events.push({
      event: eventLine.slice("event: ".length),
      data: JSON.parse(dataLine.slice("data: ".length)) as unknown,
    });
  }

  return {events, rest};
};

const formatTime = (value: string | null | undefined) => {
  if (!value) return "No messages";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};

export default function ChatClient({
  conversations: initialConversations,
  initialMessages,
  selectedConversationId,
  workflows,
}: ChatClientProps) {
  const router = useRouter();
  const [conversations, setConversations] = useState(initialConversations);
  const [messages, setMessages] = useState(initialMessages);
  const [activeConversationId, setActiveConversationId] = useState(selectedConversationId);
  const [newWorkflowId, setNewWorkflowId] = useState(workflows[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState("");
  const [traceMessageId, setTraceMessageId] = useState<string | null>(null);
  const liveEventsRef = useRef<Record<string, ChatEvent[]>>({});

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId),
    [activeConversationId, conversations],
  );

  const traceMessage = useMemo(
    () => messages.find((message) => message.id === traceMessageId) ?? null,
    [messages, traceMessageId],
  );

  const selectConversation = async (conversationId: string) => {
    setActiveConversationId(conversationId);
    setTraceMessageId(null);
    setError("");
    router.push(`/chat/${conversationId}`);

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      const payload = (await response.json()) as {messages?: ConversationMessageRecord[]; error?: string};
      if (!response.ok) throw new Error(payload.error ?? `Could not load messages (${response.status}).`);
      setMessages(payload.messages ?? []);
    } catch (nextError) {
      setMessages([]);
      setError(nextError instanceof Error ? nextError.message : "Could not load messages.");
    }
  };

  const refreshConversations = async () => {
    const response = await fetch("/api/conversations");
    const payload = (await response.json()) as {conversations?: ConversationRecord[]};
    setConversations(payload.conversations ?? []);
  };

  const createConversation = async () => {
    if (!newWorkflowId) return;
    setIsCreating(true);
    setError("");
    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({workflow_id: newWorkflowId}),
      });
      const payload = (await response.json()) as {conversation?: ConversationRecord; error?: string};
      if (!response.ok || !payload.conversation) {
        throw new Error(payload.error ?? `Could not create conversation (${response.status}).`);
      }
      setConversations((current) => [payload.conversation!, ...current]);
      setMessages([]);
      setActiveConversationId(payload.conversation.id);
      router.push(`/chat/${payload.conversation.id}`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not create conversation.");
    } finally {
      setIsCreating(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    const response = await fetch(`/api/conversations/${conversationId}`, {method: "DELETE"});
    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as {error?: string};
      setError(payload.error ?? `Could not delete conversation (${response.status}).`);
      return;
    }
    const next = conversations.filter((conversation) => conversation.id !== conversationId);
    setConversations(next);
    if (conversationId === activeConversationId) {
      const nextActive = next[0]?.id ?? "";
      setActiveConversationId(nextActive);
      setMessages([]);
      router.push(nextActive ? `/chat/${nextActive}` : "/chat");
      if (nextActive) void selectConversation(nextActive);
    }
  };

  const sendMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if (!activeConversation || !content || isRunning) return;

    setDraft("");
    setError("");
    setIsRunning(true);

    try {
      const response = await fetch(`/api/conversations/${activeConversation.id}/messages`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({content}),
      });
      if (!response.ok || !response.body) {
        throw new Error(`Chat workflow run failed with HTTP ${response.status}.`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let activeAssistantId = "";

      while (true) {
        const {done, value} = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, {stream: true});
        const parsed = parseSseChunk(buffer);
        buffer = parsed.rest;

        for (const parsedEvent of parsed.events) {
          const data = asObject(parsedEvent.data);
          if (parsedEvent.event === "chat_messages_created") {
            const userMessage = data.user_message as ConversationMessageRecord | undefined;
            const assistantMessage = data.assistant_message as ConversationMessageRecord | undefined;
            activeAssistantId = assistantMessage?.id ?? "";
            if (activeAssistantId) liveEventsRef.current[activeAssistantId] = [];
            setMessages((current) => [
              ...current,
              ...(userMessage ? [userMessage] : []),
              ...(assistantMessage ? [assistantMessage] : []),
            ]);
            continue;
          }

          if (activeAssistantId) {
            liveEventsRef.current[activeAssistantId] = [
              ...(liveEventsRef.current[activeAssistantId] ?? []),
              parsedEvent,
            ];
            setMessages((current) => current.map((message) => message.id === activeAssistantId
              ? {
                ...message,
                metadata: {
                  ...message.metadata,
                  live_events: liveEventsRef.current[activeAssistantId],
                },
              }
              : message));
          }

          if (parsedEvent.event === "chat_message_completed") {
            const assistantMessage = data.assistant_message as ConversationMessageRecord | undefined;
            if (assistantMessage) {
              setMessages((current) => current.map((message) => message.id === assistantMessage.id ? assistantMessage : message));
            }
          }

          if (parsedEvent.event === "workflow_error") {
            setError(String(data.error ?? "Workflow execution failed."));
          }
        }
      }

      await refreshConversations();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not send message.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#f5f7fb]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="border-b border-zinc-200 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Chat</p>
            <h1 className="mt-1 text-xl font-semibold text-zinc-950">Conversations</h1>
            <div className="mt-4 space-y-2">
              <select
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                disabled={workflows.length === 0}
                onChange={(event) => setNewWorkflowId(event.target.value)}
                value={newWorkflowId}
              >
                {workflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>{workflow.title}</option>
                ))}
              </select>
              <button
                className="w-full rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                disabled={!newWorkflowId || isCreating}
                onClick={() => void createConversation()}
                type="button"
              >
                {isCreating ? "Creating..." : "New Conversation"}
              </button>
            </div>
          </div>

          <div className="max-h-[calc(100vh-17rem)] overflow-y-auto p-2">
            {conversations.map((conversation) => {
              const isActive = conversation.id === activeConversationId;
              return (
                <div
                  key={conversation.id}
                  className={`group rounded-xl border p-3 transition ${
                    isActive ? "border-zinc-950 bg-zinc-950 text-white" : "border-transparent hover:border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  <button
                    className="block w-full text-left"
                    onClick={() => void selectConversation(conversation.id)}
                    type="button"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`line-clamp-1 text-sm font-semibold ${isActive ? "text-white" : "text-zinc-950"}`}>
                        {conversation.title}
                      </p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isActive ? "bg-white/15 text-white" : "bg-zinc-100 text-zinc-600"}`}>
                        {conversation.message_count ?? 0}
                      </span>
                    </div>
                    <p className={`mt-1 line-clamp-1 text-xs ${isActive ? "text-zinc-300" : "text-zinc-500"}`}>
                      {conversation.workflow_title || conversation.workflow_id}
                    </p>
                    <p className={`mt-2 line-clamp-2 text-xs leading-5 ${isActive ? "text-zinc-300" : "text-zinc-500"}`}>
                      {conversation.last_message || "No messages yet"}
                    </p>
                    <p className={`mt-2 text-[11px] ${isActive ? "text-zinc-400" : "text-zinc-400"}`}>
                      {formatTime(conversation.last_message_at ?? conversation.updated_at)}
                    </p>
                  </button>
                  <button
                    className={`mt-2 text-[11px] font-semibold opacity-0 transition group-hover:opacity-100 ${isActive ? "text-zinc-300 hover:text-white" : "text-red-500 hover:text-red-600"}`}
                    onClick={() => void deleteConversation(conversation.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              );
            })}

            {conversations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">
                Create a conversation from a workflow to start chatting.
              </div>
            ) : null}
          </div>
        </aside>

        <main className="grid min-h-[calc(100vh-5.5rem)] grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="flex min-h-0 flex-col rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
            <div className="border-b border-zinc-200 p-4">
              {activeConversation ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-950">{activeConversation.title}</h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        Workflow: {activeConversation.workflow_title || activeConversation.workflow_id}
                      </p>
                    </div>
                    <Link className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50" href={`/workflow/${activeConversation.workflow_id}`}>
                      Open Workflow
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-zinc-950">No conversation selected</h2>
                  <p className="mt-1 text-sm text-zinc-500">Create a conversation or select one from the list.</p>
                </>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-zinc-50/70 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isUser = message.role === "user";
                  const isAssistant = message.role === "assistant";
                  return (
                    <div key={message.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
                        isUser ? "bg-zinc-950 text-white" : message.status === "failed" ? "border border-red-200 bg-red-50 text-red-800" : "border border-zinc-200 bg-white text-zinc-900"
                      }`}>
                        {isUser ? (
                          <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                        ) : (
                          <>
                            {message.status === "pending" ? (
                              <p className="text-sm leading-6 text-zinc-500">Running workflow...</p>
                            ) : (
                              <Markdown content={message.content} className={message.status === "failed" ? "text-red-800" : ""} />
                            )}
                            {isAssistant ? (
                              <button
                                className="mt-3 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:bg-zinc-50"
                                onClick={() => setTraceMessageId(message.id)}
                                type="button"
                              >
                                Trace
                              </button>
                            ) : null}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}

                {messages.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-6 py-16 text-center">
                    <h3 className="text-base font-semibold text-zinc-950">Start the conversation</h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      Send a message and this conversation will trigger its selected workflow.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <form className="border-t border-zinc-200 p-4" onSubmit={(event) => void sendMessage(event)}>
              {error ? (
                <p className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
              ) : null}
              <div className="flex gap-3">
                <textarea
                  className="min-h-16 flex-1 resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-800 outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  disabled={!activeConversation || isRunning}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={activeConversation ? "Ask this workflow..." : "Select a conversation first"}
                  value={draft}
                />
                <button
                  className="w-24 rounded-xl bg-zinc-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
                  disabled={!activeConversation || !draft.trim() || isRunning}
                  type="submit"
                >
                  {isRunning ? "Sending" : "Send"}
                </button>
              </div>
            </form>
          </section>

          <aside className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-zinc-950">Trace</h2>
              {traceMessage ? (
                <button className="text-sm font-semibold text-zinc-500 hover:text-zinc-900" onClick={() => setTraceMessageId(null)} type="button">
                  Close
                </button>
              ) : null}
            </div>

            {!traceMessage ? (
              <p className="mt-4 rounded-xl border border-dashed border-zinc-200 px-3 py-12 text-center text-sm text-zinc-500">
                Select an assistant message trace to inspect workflow execution.
              </p>
            ) : (
              <div className="mt-4 max-h-[calc(100vh-10rem)] space-y-3 overflow-y-auto pr-1">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Status</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">{traceMessage.status}</p>
                  <p className="mt-1 text-xs text-zinc-500">{formatTime(traceMessage.created_at)}</p>
                </div>

                {traceMessage.workflow_run ? (
                  <>
                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Workflow Run</p>
                      <p className="mt-1 break-all font-mono text-xs text-zinc-700">{traceMessage.workflow_run.id}</p>
                      <p className="mt-2 text-sm text-zinc-700">{traceMessage.workflow_run.status}</p>
                      {traceMessage.workflow_run.error ? (
                        <p className="mt-2 rounded-lg bg-red-50 px-2 py-1.5 text-xs text-red-700">{traceMessage.workflow_run.error}</p>
                      ) : null}
                    </div>
                    {traceMessage.workflow_run.trace.map((item, index) => (
                      <details className="rounded-xl border border-zinc-200 bg-white p-3" key={`${item.nodeId}-${index}`}>
                        <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
                          {item.nodeType} · {item.status}
                        </summary>
                        {item.detail ? <p className="mt-2 text-xs text-zinc-500">{item.detail}</p> : null}
                        <pre className="mt-3 max-h-60 overflow-auto rounded-lg bg-zinc-950 p-3 text-xs leading-5 text-zinc-100">
                          {JSON.stringify({
                            input: item.input,
                            processData: item.processData,
                            output: item.output,
                          }, null, 2)}
                        </pre>
                      </details>
                    ))}
                  </>
                ) : (
                  <div className="space-y-2">
                    {((traceMessage.metadata.live_events as ChatEvent[] | undefined) ?? []).map((event, index) => (
                      <details className="rounded-xl border border-zinc-200 bg-white p-3" key={`${event.event}-${index}`}>
                        <summary className="cursor-pointer text-sm font-semibold text-zinc-900">{event.event}</summary>
                        <pre className="mt-3 max-h-60 overflow-auto rounded-lg bg-zinc-950 p-3 text-xs leading-5 text-zinc-100">
                          {JSON.stringify(event.data, null, 2)}
                        </pre>
                      </details>
                    ))}
                    {!((traceMessage.metadata.live_events as ChatEvent[] | undefined) ?? []).length ? (
                      <p className="rounded-xl border border-dashed border-zinc-200 px-3 py-8 text-center text-sm text-zinc-500">
                        No trace is linked yet.
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </aside>
        </main>
      </div>
    </div>
  );
}
