"use client";

import { PanelField, PanelInput, PanelTextArea } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type SimpleNodeData = {
  label?: string;
  description?: string;
};

export default function SimplePanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as SimpleNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Simple Node"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Description">
        <PanelTextArea className="min-h-24" value={data.description ?? ""} onChange={(event) => patchNodeData({ description: event.target.value })} />
      </PanelField>
    </div>
  );
}
