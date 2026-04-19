"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type LoopNodeData = {
  label?: string;
  condition?: string;
  maxIterations?: number;
};

export default function LoopPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as LoopNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Loop"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Condition">
        <PanelInput value={data.condition ?? ""} onChange={(event) => patchNodeData({ condition: event.target.value })} />
      </PanelField>
      <PanelField label="Max Iterations">
        <PanelInput type="number" value={data.maxIterations ?? 10} onChange={(event) => patchNodeData({ maxIterations: Number(event.target.value) })} />
      </PanelField>
    </div>
  );
}
