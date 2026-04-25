"use client";

import { PanelButton, PanelCard, PanelField, PanelInput, PanelTextArea } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type LlmMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type LlmNodeData = {
  apiBaseUrl?: string;
  apiKey?: string;
  model?: string;
  context?: {
    enabled?: boolean;
    variable_selector?: string[];
  };
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

export default function LlmPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as LlmNodeData;
  const contextSelector = (data.context?.variable_selector ?? ["sys", "query"]).join(".");
  const messages = normalizeMessages(data.messages);

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

  function addMessage(role: "user" | "assistant") {
    patchNodeData({
      messages: normalizeMessages([
        ...messages,
        {
          role,
          content: role === "user" ? "{{#sys.query#}}" : "",
        },
      ]),
    });
  }

  return (
    <div className="space-y-4">
      <PanelCard>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800">Model</p>
          <p className="text-xs leading-5 text-zinc-500">配置 LLM 模型、API 連線，同埋 vision 開關。</p>
        </div>

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
          <p className="text-xs leading-5 text-zinc-500">控制是否將上文或指定變數作為 prompt context。</p>
        </div>

        <label className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2">
          <span className="text-sm font-medium text-zinc-700">Enable Context</span>
          <input
            type="checkbox"
            checked={data.context?.enabled ?? true}
            onChange={(event) =>
              patchNodeData({
                context: {
                  ...(data.context ?? {}),
                  enabled: event.target.checked,
                },
              })}
          />
        </label>

        <PanelField label="Variable Selector">
          <PanelInput
            value={contextSelector}
            placeholder="sys.query"
            onChange={(event) =>
              patchNodeData({
                context: {
                  ...(data.context ?? {}),
                  variable_selector: event.target.value.split(".").map((item) => item.trim()).filter(Boolean),
                },
              })}
          />
        </PanelField>
      </PanelCard>

      <PanelCard>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800">Messages</p>
          <p className="text-xs leading-5 text-zinc-500">
            `system` message 固定保留而且永遠排第一。你可以新增更多 `user` 或 `assistant` message。
          </p>
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
                <PanelTextArea
                  rows={index === 0 ? 4 : 5}
                  value={message.content}
                  onChange={(event) =>
                    updateMessage(index, {
                      ...message,
                      content: event.target.value,
                    })}
                />
              </PanelField>
            </div>
          ))}
        </div>

        <PanelButton onClick={() => addMessage("user")}>
          Add Message
        </PanelButton>
      </PanelCard>
    </div>
  );
}
