"use client";

import { PanelCard, PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
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
  const queryVariable = data.variables?.[0]?.name ?? "query";
  const filesVariable = data.variables?.[1]?.name ?? "files";

  return (
    <div className="space-y-4">
      <PanelCard>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800">Start Node</p>
        </div>

        <PanelField label="Label">
          <PanelInput value={data.label ?? "Start"} onChange={(event) => patchNodeData({ label: event.target.value })} />
        </PanelField>
      </PanelCard>

      {/*<PanelCard>*/}
      {/*  <div className="space-y-1">*/}
      {/*    <p className="text-sm font-semibold text-zinc-800">Fixed Variables</p>*/}
      {/*  </div>*/}

      {/*  /!*<PanelField label="Query Variable">*!/*/}
      {/*  /!*  <PanelInput value={queryVariable} readOnly disabled />*!/*/}
      {/*  /!*</PanelField>*!/*/}

      {/*  /!*<PanelField label="Files Variable">*!/*/}
      {/*  /!*  <PanelInput value={filesVariable} readOnly disabled />*!/*/}
      {/*  /!*</PanelField>*!/*/}
      {/*</PanelCard>*/}
    </div>
  );
}
