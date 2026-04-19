"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type StartVariable = {
  name?: string;
  required?: boolean;
  type?: string;
};

type StartNodeData = {
  label?: string;
  variables?: StartVariable[];
};

export default function StartPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as StartNodeData;
  const variables = data.variables ?? [];

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Start"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Query Variable">
        <PanelInput
          value={variables[0]?.name ?? "query"}
          onChange={(event) => {
            const nextVariables = [...variables];
            nextVariables[0] = {
              ...(nextVariables[0] ?? {}),
              name: event.target.value,
              required: true,
              type: nextVariables[0]?.type ?? "string",
            };
            patchNodeData({ variables: nextVariables });
          }}
        />
      </PanelField>
      <PanelField label="Files Variable">
        <PanelInput
          value={variables[1]?.name ?? "files"}
          onChange={(event) => {
            const nextVariables = [...variables];
            nextVariables[1] = {
              ...(nextVariables[1] ?? {}),
              name: event.target.value,
              type: nextVariables[1]?.type ?? "file[]",
            };
            patchNodeData({ variables: nextVariables });
          }}
        />
      </PanelField>
    </div>
  );
}
