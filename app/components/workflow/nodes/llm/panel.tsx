"use client";

import { useEffect, useRef } from "react";
import { PanelButton, PanelCard, PanelField, PanelInput, PanelTextArea } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";
import type { Edge } from "reactflow";

type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type LlmNodeData = {
  label?: string;
  apiBaseUrl?: string;
  apiKey?: string;
  model?: string;
  context_variable?: string;
  vision_enable?: boolean;
  messages?: LlmMessage[];
};

function normalizeMessages(messages?: LlmMessage[]) {
  const safeMessages = Array.isArray(messages) ? messages : [];
  const systemMessage = safeMessages.find((item) => item.role === "system") ?? {
    role: "system" as const,
    content: "You are a helpful assistant.",
  };
  const otherMessages = safeMessages.filter((item) => item.role !== "system");
  return [systemMessage, ...otherMessages];
}

function getWordCount(content: string) {
  const trimmed = content.trim();
  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+/).filter(Boolean).length;
}

function getAncestorNodeIds(currentNodeId: string, edges: Edge[]) {
  const parentsByTarget = new Map<string, string[]>();
  edges.forEach((edge) => {
    const existing = parentsByTarget.get(edge.target) ?? [];
    existing.push(edge.source);
    parentsByTarget.set(edge.target, existing);
  });

  const visited = new Set<string>();
  const stack = [...(parentsByTarget.get(currentNodeId) ?? [])];

  while (stack.length > 0) {
    const nodeId = stack.pop()!;
    if (visited.has(nodeId)) {
      continue;
    }
    visited.add(nodeId);
    (parentsByTarget.get(nodeId) ?? []).forEach((parentId) => {
      if (!visited.has(parentId)) {
        stack.push(parentId);
      }
    });
  }

  return visited;
}

function getContextOptions(allNodes: NodePanelProps["allNodes"], allEdges: NodePanelProps["allEdges"], currentNodeId: string) {
  const nodes = allNodes ?? [];
  const ancestorNodeIds = getAncestorNodeIds(currentNodeId, allEdges ?? []);

  return nodes.flatMap((item) => {
    if (!ancestorNodeIds.has(item.id)) {
      return [];
    }

    const nodeType = String(item.data?.type ?? "");
    const nodeLabel = typeof item.data?.label === "string" && item.data.label.trim()
      ? item.data.label.trim()
      : item.id;

    const fields: string[] = (() => {
      switch (nodeType) {
        case "start":
          return ["query", "files"];
        case "llm":
        case "agent":
          return ["text", "usage", "model"];
        case "questionClassifier":
          return ["class_id", "class_name", "keywords"];
        case "documentExtractor":
          return ["documents", "text"];
        case "http":
          return ["status_code", "body", "headers"];
        default:
          return ["output"];
      }
    })();

    return fields.map((field) => ({
      value: `${item.id}.${field}`,
      label: `(${nodeLabel}/${field})`,
    }));
  });
}

function getNodeLabelMap(allNodes: NodePanelProps["allNodes"]) {
  return new Map(
    (allNodes ?? []).map((item) => {
      const label = typeof item.data?.label === "string" && item.data.label.trim()
        ? item.data.label.trim()
        : item.id;
      return [item.id, label] as const;
    }),
  );
}

export default function LlmPanel({ node, patchNodeData, allNodes, allEdges }: NodePanelProps) {
  const data = (node.data ?? {}) as LlmNodeData;
  const messages = normalizeMessages(data.messages);
  const availableContextOptions = getContextOptions(allNodes, allEdges, node.id);
  const requiresContextPlaceholder = Boolean(data.context_variable);
  const messageRefs = useRef<Array<HTMLTextAreaElement | null>>([]);
  const nodeLabelMap = getNodeLabelMap(allNodes);

  function renderTokenChip(expression: string) {
    if (expression === "context") {
      return "context";
    }

    const parts = expression.split(".").filter(Boolean);
    if (parts.length === 0) {
      return expression;
    }

    const source = parts[0];
    const field = parts.slice(1).join(".") || "value";
    const sourceLabel = nodeLabelMap.get(source) || source;
    return `${sourceLabel}/${field}`;
  }

  function resizeTextArea(textarea: HTMLTextAreaElement | null) {
    if (!textarea) {
      return;
    }

    textarea.style.height = "56px";
    textarea.style.height = `${Math.max(56, textarea.scrollHeight)}px`;
  }

  useEffect(() => {
    messageRefs.current.forEach((textarea) => resizeTextArea(textarea));
  }, [messages]);

  function updateMessage(index: number, nextMessage: LlmMessage) {
    const nextMessages = [...messages];
    nextMessages[index] = nextMessage;
    patchNodeData({ messages: normalizeMessages(nextMessages) });
  }

  function removeMessage(index: number) {
    if (index === 0) {
      return;
    }

    patchNodeData({
      messages: normalizeMessages(messages.filter((_, messageIndex) => messageIndex !== index)),
    });
  }

  function addMessage() {
    patchNodeData({
      messages: normalizeMessages([
        ...messages,
        {
          role: "user",
          content: "{{#sys.query#}}",
        },
      ]),
    });
  }

  return (
    <div className="space-y-4">
      <PanelCard>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800">Model</p>
        </div>

        <PanelField label="Label">
          <PanelInput value={data.label ?? "LLM"} onChange={(event) => patchNodeData({ label: event.target.value })} />
        </PanelField>
        <PanelField label="Model">
          <PanelInput value={data.model ?? ""} onChange={(event) => patchNodeData({ model: event.target.value })} />
        </PanelField>
        <PanelField label="API Base URL">
          <PanelInput value={data.apiBaseUrl ?? "https://api.openai.com/v1"} onChange={(event) => patchNodeData({ apiBaseUrl: event.target.value })} />
        </PanelField>
        <PanelField label="API Key">
          <PanelInput type="password" value={data.apiKey ?? ""} onChange={(event) => patchNodeData({ apiKey: event.target.value })} />
        </PanelField>

        <label className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2">
          <span className="text-sm font-medium text-zinc-700">Enable Vision</span>
          <input
            type="checkbox"
            checked={data.vision_enable ?? false}
            onChange={(event) => patchNodeData({ vision_enable: event.target.checked })}
          />
        </label>
      </PanelCard>

      <PanelCard>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800">Context</p>
        </div>

        <PanelField label="Context Variable">
          <select
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            value={data.context_variable ?? ""}
            onChange={(event) => patchNodeData({ context_variable: event.target.value })}
          >
            <option value="">None</option>
            {availableContextOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </PanelField>

        {requiresContextPlaceholder && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
            已選擇 <code>Context Variable</code>。你必須喺呢個 LLM node 自己嘅任一 message 內加入 <code>{"{{#context#}}"}</code>。
          </div>
        )}
      </PanelCard>

      <PanelCard>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800">Messages</p>
        </div>

        <div className="space-y-3">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className="rounded-2xl border border-zinc-200 bg-white p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600">
                  {message.role}
                </div>
                {index !== 0 && (
                  <button
                    className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50"
                    type="button"
                    onClick={() => removeMessage(index)}
                  >
                    Remove
                  </button>
                )}
              </div>

              {index !== 0 && (
                <PanelField label="Role">
                  <select
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    value={message.role}
                    onChange={(event) =>
                      updateMessage(index, {
                        ...message,
                        role: event.target.value as "user" | "assistant",
                      })}
                  >
                    <option value="user">user</option>
                    <option value="assistant">assistant</option>
                  </select>
                </PanelField>
              )}

              <PanelField label="Content">
                <div className="relative">
                  <PanelTextArea
                    ref={(element) => {
                      messageRefs.current[index] = element;
                    }}
                    tokenChipRenderer={renderTokenChip}
                    rows={1}
                    className="min-h-[56px] resize-none overflow-hidden pt-8"
                    style={{ height: 56 }}
                    value={message.content}
                    placeholder="Write your prompt word here, enter '{' to insert a variable, enter '/' to insert a prompt content block"
                    onChange={(event) => {
                      resizeTextArea(event.currentTarget);
                      updateMessage(index, {
                        ...message,
                        content: event.target.value,
                      });
                    }}
                  />
                  <div className="pointer-events-none absolute right-3 top-2 text-[11px] font-medium text-zinc-400">
                    {getWordCount(message.content)} words
                  </div>
                </div>
              </PanelField>
            </div>
          ))}
        </div>

        <PanelButton onClick={addMessage}>
          Add Message
        </PanelButton>
      </PanelCard>
    </div>
  );
}
