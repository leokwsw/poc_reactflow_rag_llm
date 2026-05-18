"use client";

import {useEffect, useState} from "react";
import {PanelButton, PanelCard, PanelField, PanelInput} from "@/app/components/workflow/nodes/_base/panel-form";
import type {NodePanelProps} from "@/app/components/workflow/nodes/panel-types";
import {getContextOptions, getPromptVariableOptions} from "@/app/components/workflow/nodes/prompt-variable-options";
import ModelProfileSelect from "@/app/components/workflow/nodes/_base/model-profile-select";
import WorkflowPromptEditor from "../../prompt-editor";

type AgentMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type AgentNodeData = {
  label?: string;
  model?: string;
  context_variable?: string;
  vision_enable?: boolean;
  messages?: AgentMessage[];
  maximumIterations?: number;
  tools?: string[];
};

type McpToolOption = {
  id: string;
  name: string;
  description?: string;
  server_name: string;
  server_identifier: string;
};

function normalizeMessages(messages?: AgentMessage[]) {
  const safeMessages = Array.isArray(messages) ? messages : [];
  const systemMessage = safeMessages.find((item) => item.role === "system") ?? {
    role: "system" as const,
    content: "You are a helpful AI agent. Use tools when they can improve the answer.",
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

export default function AgentPanel({node, patchNodeData, allNodes, allEdges}: NodePanelProps) {
  const data = (node.data ?? {}) as AgentNodeData;
  const messages = normalizeMessages(data.messages);
  const [mcpTools, setMcpTools] = useState<McpToolOption[]>([]);
  const [toolsError, setToolsError] = useState("");
  const selectedTools = data.tools ?? [];
  const selectedToolSet = new Set(selectedTools);
  const availableContextOptions = getContextOptions(allNodes, allEdges, node.id);
  const requiresContextPlaceholder = Boolean(data.context_variable);
  const promptVariableOptions = getPromptVariableOptions(allNodes, allEdges, node.id, data.context_variable);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/mcp/tools")
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Could not load MCP tools.");
        }
        if (!cancelled) {
          setMcpTools(Array.isArray(payload.tools) ? payload.tools : []);
          setToolsError("");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setMcpTools([]);
          setToolsError(error instanceof Error ? error.message : "Could not load MCP tools.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function updateMessage(index: number, nextMessage: AgentMessage) {
    const nextMessages = [...messages];
    nextMessages[index] = nextMessage;
    patchNodeData({messages: normalizeMessages(nextMessages)});
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

  function toggleTool(toolId: string, checked: boolean) {
    const nextTools = checked
      ? Array.from(new Set([...selectedTools, toolId]))
      : selectedTools.filter((item) => item !== toolId);
    patchNodeData({tools: nextTools});
  }

  return (
    <div className="space-y-4">
      <PanelCard>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800">Model</p>
        </div>

        <PanelField label="Label">
          <PanelInput value={data.label ?? "Agent"} onChange={(event) => patchNodeData({label: event.target.value})} />
        </PanelField>
        <PanelField label="Model">
          <ModelProfileSelect value={data.model} onChange={(model) => patchNodeData({model})} />
        </PanelField>
        <PanelField label="Maximum Iterations">
          <PanelInput
            type="number"
            min={1}
            max={20}
            value={String(data.maximumIterations ?? 3)}
            onChange={(event) => patchNodeData({maximumIterations: Math.max(1, Number(event.target.value) || 1)})}
          />
        </PanelField>

        <label className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2">
          <span className="text-sm font-medium text-zinc-700">Enable Vision</span>
          <input
            type="checkbox"
            checked={data.vision_enable ?? false}
            onChange={(event) => patchNodeData({vision_enable: event.target.checked})}
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
            onChange={(event) => patchNodeData({context_variable: event.target.value})}
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
            已選擇 <code>Context Variable</code>。你必須喺呢個 Agent node 自己嘅任一 message 內加入 <code>{"{{#context#}}"}</code>。
          </div>
        )}
      </PanelCard>

      <PanelCard>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-zinc-800">MCP Tools</p>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-zinc-600">{selectedTools.length}</span>
        </div>

        {toolsError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">{toolsError}</div>
        ) : null}

        <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
          {mcpTools.length > 0 ? mcpTools.map((tool) => (
            <label key={tool.id} className="block rounded-xl border border-zinc-200 bg-white px-3 py-2">
              <div className="flex items-start gap-3">
                <input
                  className="mt-1"
                  type="checkbox"
                  checked={selectedToolSet.has(tool.id)}
                  onChange={(event) => toggleTool(tool.id, event.target.checked)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-zinc-800">{tool.name}</span>
                  <span className="block truncate text-xs text-zinc-500">{tool.server_name}</span>
                  {tool.description ? (
                    <span className="mt-1 line-clamp-2 block text-xs leading-5 text-zinc-500">{tool.description}</span>
                  ) : null}
                </span>
              </div>
            </label>
          )) : (
            <div className="rounded-xl border border-dashed border-zinc-200 bg-white px-3 py-4 text-center text-sm text-zinc-500">
              No MCP tools available
            </div>
          )}
        </div>
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
                  <WorkflowPromptEditor
                    value={message.content}
                    variableOptions={promptVariableOptions}
                    minHeightClassName="min-h-[56px] pt-8"
                    placeholder="Write your prompt word here, enter '{' to insert a variable, enter '/' to insert a prompt content block"
                    onChange={(event) => {
                      updateMessage(index, {
                        ...message,
                        content: event,
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
