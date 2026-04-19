"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type ListOperatorNodeData = {
  label?: string;
  operation?: string;
  targetList?: string;
};

export default function ListOperatorPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as ListOperatorNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "List Operator"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Operation">
        <PanelInput value={data.operation ?? ""} onChange={(event) => patchNodeData({ operation: event.target.value })} />
      </PanelField>
      <PanelField label="Target List">
        <PanelInput value={data.targetList ?? ""} onChange={(event) => patchNodeData({ targetList: event.target.value })} />
      </PanelField>
    </div>
  );
}
