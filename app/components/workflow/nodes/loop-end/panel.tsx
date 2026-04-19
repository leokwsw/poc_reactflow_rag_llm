"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type LoopEndNodeData = {
  label?: string;
  aggregate?: string;
};

export default function LoopEndPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as LoopEndNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Loop End"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Aggregate">
        <PanelInput value={data.aggregate ?? ""} onChange={(event) => patchNodeData({ aggregate: event.target.value })} />
      </PanelField>
    </div>
  );
}
