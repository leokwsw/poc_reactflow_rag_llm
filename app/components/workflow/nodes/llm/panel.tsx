"use client";

import { PanelCard, PanelField, PanelInput, PanelTextArea } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type PromptTemplateItem = {
  role?: string;
  text?: string;
  id?: string;
  edition_type?: string;
};

type LlmNodeData = {
  apiBaseUrl?: string;
  apiKey?: string;
  provider?: string;
  model?: string;
  systemPrompt?: string;
  prompt_template?: PromptTemplateItem[];
  context?: {
    enabled?: boolean;
    variable_selector?: string[];
  };
  vision?: {
    enabled?: boolean;
  };
  memory?: {
    window?: {
      enabled?: boolean;
      size?: number;
    };
    query_prompt_template?: string;
    role_prefix?: {
      user?: string;
      assistant?: string;
    };
  };
  prompt_config?: {
    jinja2_variables?: string[];
  };
};

function getSystemPromptItem(data: LlmNodeData) {
  const promptTemplate = Array.isArray(data.prompt_template) ? data.prompt_template : [];
  const systemItemIndex = promptTemplate.findIndex((item) => item.role === "system");

  if (systemItemIndex >= 0) {
    return {
      promptTemplate,
      systemItemIndex,
      systemItem: promptTemplate[systemItemIndex],
    };
  }

  return {
    promptTemplate,
    systemItemIndex: -1,
    systemItem: {
      role: "system",
      text: data.systemPrompt ?? "",
      edition_type: "basic",
    },
  };
}

export default function LlmPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as LlmNodeData;
  const { promptTemplate, systemItemIndex, systemItem } = getSystemPromptItem(data);
  const contextSelector = (data.context?.variable_selector ?? ["sys", "query"]).join(".");
  const memoryWindowSize = data.memory?.window?.size ?? 10;
  const jinjaVariables = data.prompt_config?.jinja2_variables ?? [];

  return (
    <div className="space-y-4">
      <PanelCard>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800">Model</p>
          <p className="text-xs leading-5 text-zinc-500">配置 LLM 模型同 API 連線資訊。</p>
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
        <PanelField label="Provider">
          <PanelInput value={data.provider ?? ""} onChange={(event) => patchNodeData({ provider: event.target.value })} />
        </PanelField>
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
          <p className="text-sm font-semibold text-zinc-800">SYSTEM</p>
          <p className="text-xs leading-5 text-zinc-500">對應 Dify 嘅 system prompt message。</p>
        </div>

        <PanelField label="System Prompt">
          <PanelTextArea
            className="min-h-28"
            value={systemItem.text ?? ""}
            onChange={(event) => {
              const nextPromptTemplate = [...promptTemplate];
              const nextSystemItem = {
                ...systemItem,
                role: "system",
                text: event.target.value,
                edition_type: systemItem.edition_type ?? "basic",
              };

              if (systemItemIndex >= 0) {
                nextPromptTemplate[systemItemIndex] = nextSystemItem;
              } else {
                nextPromptTemplate.unshift(nextSystemItem);
              }

              patchNodeData({
                systemPrompt: event.target.value,
                prompt_template: nextPromptTemplate,
              });
            }}
          />
        </PanelField>
      </PanelCard>

      <PanelCard>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800">Memory</p>
          <p className="text-xs leading-5 text-zinc-500">對應記憶窗口、query prompt template 同 role prefix。</p>
        </div>

        <label className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2">
          <span className="text-sm font-medium text-zinc-700">Enable Memory Window</span>
          <input
            type="checkbox"
            checked={data.memory?.window?.enabled ?? false}
            onChange={(event) =>
              patchNodeData({
                memory: {
                  ...(data.memory ?? {}),
                  window: {
                    ...(data.memory?.window ?? {}),
                    enabled: event.target.checked,
                    size: data.memory?.window?.size ?? 10,
                  },
                },
              })}
          />
        </label>

        <PanelField label="Memory Window Size">
          <PanelInput
            type="number"
            min={1}
            max={100}
            value={String(memoryWindowSize)}
            onChange={(event) =>
              patchNodeData({
                memory: {
                  ...(data.memory ?? {}),
                  window: {
                    ...(data.memory?.window ?? {}),
                    enabled: data.memory?.window?.enabled ?? false,
                    size: Math.max(1, Number(event.target.value) || 1),
                  },
                },
              })}
          />
        </PanelField>

        <PanelField label="Query Prompt Template">
          <PanelTextArea
            rows={4}
            value={data.memory?.query_prompt_template ?? "{{query}}\n\n{{files}}"}
            onChange={(event) =>
              patchNodeData({
                memory: {
                  ...(data.memory ?? {}),
                  query_prompt_template: event.target.value,
                },
              })}
          />
        </PanelField>

        <PanelField label="Role Prefix (User)">
          <PanelInput
            value={data.memory?.role_prefix?.user ?? ""}
            onChange={(event) =>
              patchNodeData({
                memory: {
                  ...(data.memory ?? {}),
                  role_prefix: {
                    ...(data.memory?.role_prefix ?? {}),
                    user: event.target.value,
                    assistant: data.memory?.role_prefix?.assistant ?? "",
                  },
                },
              })}
          />
        </PanelField>

        <PanelField label="Role Prefix (Assistant)">
          <PanelInput
            value={data.memory?.role_prefix?.assistant ?? ""}
            onChange={(event) =>
              patchNodeData({
                memory: {
                  ...(data.memory ?? {}),
                  role_prefix: {
                    ...(data.memory?.role_prefix ?? {}),
                    assistant: event.target.value,
                    user: data.memory?.role_prefix?.user ?? "",
                  },
                },
              })}
          />
        </PanelField>
      </PanelCard>

      <PanelCard>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800">Vision & Output</p>
          <p className="text-xs leading-5 text-zinc-500">補上你圖中嘅視覺與 prompt config 基本欄位。</p>
        </div>

        <label className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2">
          <span className="text-sm font-medium text-zinc-700">Enable Vision</span>
          <input
            type="checkbox"
            checked={data.vision?.enabled ?? false}
            onChange={(event) =>
              patchNodeData({
                vision: {
                  ...(data.vision ?? {}),
                  enabled: event.target.checked,
                },
              })}
          />
        </label>

        <PanelField label="Jinja Variables">
          <PanelInput
            value={jinjaVariables.join(", ")}
            placeholder="var_a, var_b"
            onChange={(event) =>
              patchNodeData({
                prompt_config: {
                  ...(data.prompt_config ?? {}),
                  jinja2_variables: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                },
              })}
          />
        </PanelField>
      </PanelCard>
    </div>
  );
}
