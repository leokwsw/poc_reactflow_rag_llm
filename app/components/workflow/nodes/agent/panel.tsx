"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type AgentNodeData = {
  label?: string;
  role?: string;
  tools?: string[];
};

export default function AgentPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as AgentNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Agent"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Role">
        <PanelInput value={data.role ?? ""} onChange={(event) => patchNodeData({ role: event.target.value })} />
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
