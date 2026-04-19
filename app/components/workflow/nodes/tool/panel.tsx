"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type ToolNodeData = {
  label?: string;
  toolName?: string;
  outputSchema?: string[];
};

export default function ToolPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as ToolNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Tool"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Tool Name">
        <PanelInput value={data.toolName ?? ""} onChange={(event) => patchNodeData({ toolName: event.target.value })} />
      </PanelField>
      <PanelField label="Output Schema (comma separated)">
        <PanelInput
          value={(data.outputSchema ?? []).join(", ")}
          onChange={(event) => patchNodeData({ outputSchema: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })}
        />
      </PanelField>
    </div>
  );
}
