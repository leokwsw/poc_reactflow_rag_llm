"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type EndNodeData = {
  label?: string;
  answer?: string;
  outputs?: string[];
};

export default function EndPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as EndNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "End"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Answer Expression">
        <PanelInput value={data.answer ?? ""} placeholder="{{3.text}}" onChange={(event) => patchNodeData({ answer: event.target.value })} />
      </PanelField>
      <PanelField label="Outputs (comma separated)">
        <PanelInput
          value={(data.outputs ?? []).join(", ")}
          onChange={(event) => patchNodeData({ outputs: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })}
        />
      </PanelField>
    </div>
  );
}
