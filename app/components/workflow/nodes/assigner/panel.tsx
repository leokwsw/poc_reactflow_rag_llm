"use client";

import { PanelButton, PanelCard, PanelField, PanelInput, PanelInlineActions } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type Assignment = {
  target: string;
  value: string;
};

type AssignerNodeData = {
  label?: string;
  assignments?: Assignment[];
};

export default function AssignerPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as AssignerNodeData;
  const assignments = data.assignments ?? [];

  return (
    <div className="space-y-4">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Assigner"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      {assignments.map((assignment, index) => (
        <PanelCard key={`${assignment.target}-${index}`}>
          <PanelInlineActions>
            <PanelButton
              className="w-auto border-0 p-0"
              danger
              onClick={() => patchNodeData({ assignments: assignments.filter((_, itemIndex) => itemIndex !== index) })}
            >
              Remove
            </PanelButton>
          </PanelInlineActions>
          <PanelInput
            placeholder="Target"
            value={assignment.target}
            onChange={(event) =>
              patchNodeData({
                assignments: assignments.map((item, itemIndex) => (itemIndex === index ? { ...item, target: event.target.value } : item)),
              })
            }
          />
          <PanelInput
            placeholder="Value"
            value={assignment.value}
            onChange={(event) =>
              patchNodeData({
                assignments: assignments.map((item, itemIndex) => (itemIndex === index ? { ...item, value: event.target.value } : item)),
              })
            }
          />
        </PanelCard>
      ))}
      <PanelButton onClick={() => patchNodeData({ assignments: [...assignments, { target: "", value: "" }] })}>Add Assignment</PanelButton>
    </div>
  );
}
