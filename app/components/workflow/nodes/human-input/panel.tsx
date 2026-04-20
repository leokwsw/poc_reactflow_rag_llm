"use client";

import { PanelField, PanelInput, PanelTextArea } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type HumanInputNodeData = {
  label?: string;
  prompt?: string;
  variableName?: string;
  required_variables?: string[];
  selectedBranch?: string;
};

export default function HumanInputPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as HumanInputNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Human Input"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Variable Name">
        <PanelInput value={data.variableName ?? "human_input"} onChange={(event) => patchNodeData({ variableName: event.target.value })} />
      </PanelField>
      <PanelField label="Required Variables">
        <PanelInput
          value={(data.required_variables ?? []).join(", ")}
          onChange={(event) =>
            patchNodeData({
              required_variables: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
            })}
        />
      </PanelField>
      <PanelField label="Selected Branch">
        <PanelInput value={data.selectedBranch ?? "source"} onChange={(event) => patchNodeData({ selectedBranch: event.target.value })} />
      </PanelField>
      <PanelField label="Prompt">
        <PanelTextArea className="min-h-24" value={data.prompt ?? ""} onChange={(event) => patchNodeData({ prompt: event.target.value })} />
      </PanelField>
    </div>
  );
}
