"use client";

import { PanelCard, PanelField, PanelInput, PanelTextArea } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type LlmNodeData = {
  apiBaseUrl?: string;
  apiKey?: string;
  provider?: string;
  model?: string;
  systemPrompt?: string;
  prompt_template?: string;
  context?: {
    enabled?: boolean;
    variable_selector?: string[];
  };
  vision_enable?: boolean;
};

export default function LlmPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as LlmNodeData;
  const contextSelector = (data.context?.variable_selector ?? ["sys", "query"]).join(".");

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
          <p className="text-xs leading-5 text-zinc-500">system prompt 只保留單一字串欄位。</p>
        </div>

        <PanelField label="System Prompt">
          <PanelTextArea
            className="min-h-28"
            value={data.systemPrompt ?? ""}
            onChange={(event) => patchNodeData({ systemPrompt: event.target.value })}
          />
        </PanelField>
      </PanelCard>

      <PanelCard>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800">Prompt</p>
          <p className="text-xs leading-5 text-zinc-500">`prompt_template` 直接保存 user prompt 模板。</p>
        </div>

        <PanelField label="Prompt Template">
          <PanelTextArea
            rows={5}
            value={data.prompt_template ?? "{{query}}\n\n{{files}}"}
            onChange={(event) => patchNodeData({ prompt_template: event.target.value })}
          />
        </PanelField>
      </PanelCard>

      <PanelCard>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800">Vision</p>
          <p className="text-xs leading-5 text-zinc-500">`vision.enabled` 已收斂成 `vision_enable`。</p>
        </div>

        <label className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2">
          <span className="text-sm font-medium text-zinc-700">Enable Vision</span>
          <input
            type="checkbox"
            checked={data.vision_enable ?? false}
            onChange={(event) => patchNodeData({ vision_enable: event.target.checked })}
          />
        </label>
      </PanelCard>
    </div>
  );
}
