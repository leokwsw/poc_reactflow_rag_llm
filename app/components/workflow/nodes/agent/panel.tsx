"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";
import WorkflowPromptEditor from "@/app/components/workflow/prompt-editor";

type AgentNodeData = {
  label?: string;
  apiBaseUrl?: string;
  apiKey?: string;
  model?: string;
  role?: string;
  instruction?: string;
  query?: string;
  maximumIterations?: number;
  tools?: string[];
};

export default function AgentPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as AgentNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Agent"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="API Base URL">
        <PanelInput value={data.apiBaseUrl ?? "https://api.openai.com/v1"} onChange={(event) => patchNodeData({ apiBaseUrl: event.target.value })} />
      </PanelField>
      <PanelField label="API Key">
        <PanelInput type="password" value={data.apiKey ?? ""} onChange={(event) => patchNodeData({ apiKey: event.target.value })} />
      </PanelField>
      <PanelField label="Model">
        <PanelInput value={data.model ?? ""} onChange={(event) => patchNodeData({ model: event.target.value })} />
      </PanelField>
      <PanelField label="Role">
        <PanelInput value={data.role ?? ""} onChange={(event) => patchNodeData({ role: event.target.value })} />
      </PanelField>
      <PanelField label="Instruction">
        <WorkflowPromptEditor
          value={data.instruction ?? ""}
          minHeightClassName="min-h-[120px]"
          onChange={(value) => patchNodeData({ instruction: value })}
        />
      </PanelField>
      <PanelField label="Query">
        <PanelInput value={data.query ?? "{{#sys.query#}}"} onChange={(event) => patchNodeData({ query: event.target.value })} />
      </PanelField>
      <PanelField label="Maximum Iterations">
        <PanelInput
          type="number"
          min={1}
          max={20}
          value={String(data.maximumIterations ?? 3)}
          onChange={(event) => patchNodeData({ maximumIterations: Math.max(1, Number(event.target.value) || 1) })}
        />
      </PanelField>
      <PanelField label="Tools (comma separated)">
        <PanelInput
          value={(data.tools ?? []).join(", ")}
          onChange={(event) => patchNodeData({ tools: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })}
        />
      </PanelField>
    </div>
  );
}
