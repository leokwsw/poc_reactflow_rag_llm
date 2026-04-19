"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type IterationNodeData = {
  label?: string;
  iterator?: string;
  itemName?: string;
};

export default function IterationPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as IterationNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Iteration"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Iterator">
        <PanelInput value={data.iterator ?? ""} onChange={(event) => patchNodeData({ iterator: event.target.value })} />
      </PanelField>
      <PanelField label="Item Name">
        <PanelInput value={data.itemName ?? ""} onChange={(event) => patchNodeData({ itemName: event.target.value })} />
      </PanelField>
    </div>
  );
}
