"use client";

import { PanelField, PanelInput, PanelTextArea } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type LlmNodeData = {
  apiBaseUrl?: string;
  apiKey?: string;
  provider?: string;
  model?: string;
  systemPrompt?: string;
};

export default function LlmPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as LlmNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="API Base URL">
        <PanelInput value={data.apiBaseUrl ?? "https://api.openai.com/v1"} onChange={(event) => patchNodeData({ apiBaseUrl: event.target.value })} />
      </PanelField>
      <PanelField label="API Key">
        <PanelInput type="password" value={data.apiKey ?? ""} onChange={(event) => patchNodeData({ apiKey: event.target.value })} />
      </PanelField>
      <PanelField label="Provider">
        <PanelInput value={data.provider ?? ""} onChange={(event) => patchNodeData({ provider: event.target.value })} />
      </PanelField>
      <PanelField label="Model">
        <PanelInput value={data.model ?? ""} onChange={(event) => patchNodeData({ model: event.target.value })} />
      </PanelField>
      <PanelField label="System Prompt">
        <PanelTextArea className="min-h-28" value={data.systemPrompt ?? ""} onChange={(event) => patchNodeData({ systemPrompt: event.target.value })} />
      </PanelField>
    </div>
  );
}
