"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type DataSourceNodeData = {
  label?: string;
  sourceType?: string;
  variableName?: string;
};

export default function DataSourcePanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as DataSourceNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Data Source"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Source Type">
        <PanelInput value={data.sourceType ?? ""} onChange={(event) => patchNodeData({ sourceType: event.target.value })} />
      </PanelField>
      <PanelField label="Variable Name">
        <PanelInput value={data.variableName ?? ""} onChange={(event) => patchNodeData({ variableName: event.target.value })} />
      </PanelField>
    </div>
  );
}
