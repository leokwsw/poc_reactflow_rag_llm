"use client";

import { PanelButton, PanelCard, PanelField, PanelInlineActions, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type VariableItem = {
  name: string;
  expression: string;
};

type VariableAssignerNodeData = {
  label?: string;
  variables?: VariableItem[];
};

export default function VariableAssignerPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as VariableAssignerNodeData;
  const variables = data.variables ?? [];

  return (
    <div className="space-y-4">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Variable Assigner"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      {variables.map((variable, index) => (
        <PanelCard key={`${variable.name}-${index}`}>
          <PanelInlineActions>
            <PanelButton
              className="w-auto border-0 p-0"
              danger
              onClick={() => patchNodeData({ variables: variables.filter((_, itemIndex) => itemIndex !== index) })}
            >
              Remove
            </PanelButton>
          </PanelInlineActions>
          <PanelInput
            placeholder="Variable Name"
            value={variable.name}
            onChange={(event) =>
              patchNodeData({
                variables: variables.map((item, itemIndex) => (itemIndex === index ? { ...item, name: event.target.value } : item)),
              })
            }
          />
          <PanelInput
            placeholder="Expression"
            value={variable.expression}
            onChange={(event) =>
              patchNodeData({
                variables: variables.map((item, itemIndex) => (itemIndex === index ? { ...item, expression: event.target.value } : item)),
              })
            }
          />
        </PanelCard>
      ))}
      <PanelButton onClick={() => patchNodeData({ variables: [...variables, { name: "", expression: "" }] })}>Add Variable</PanelButton>
    </div>
  );
}
