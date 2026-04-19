"use client";

import { PanelField, PanelInput, PanelTextArea } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type DataSourceEmptyNodeData = {
  label?: string;
  message?: string;
};

export default function DataSourceEmptyPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as DataSourceEmptyNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Data Source Empty"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Message">
        <PanelTextArea className="min-h-24" value={data.message ?? ""} onChange={(event) => patchNodeData({ message: event.target.value })} />
      </PanelField>
    </div>
  );
}
