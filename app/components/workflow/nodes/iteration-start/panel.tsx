"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type ScopeNodeData = {
  label?: string;
  scopeName?: string;
};

export default function IterationStartPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as ScopeNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Iteration Start"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Scope Name">
        <PanelInput value={data.scopeName ?? ""} onChange={(event) => patchNodeData({ scopeName: event.target.value })} />
      </PanelField>
    </div>
  );
}
