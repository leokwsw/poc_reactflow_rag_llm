"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type DocumentExtractorNodeData = {
  label?: string;
  variable_selector?: string[];
  sourceSelector?: string;
  is_array_file?: boolean;
  mode?: string;
};

export default function DocumentExtractorPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as DocumentExtractorNodeData;
  const selector = Array.isArray(data.variable_selector) && data.variable_selector.length > 0
    ? data.variable_selector.join(".")
    : data.sourceSelector ?? "start.files";

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Document Extractor"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Source Selector">
        <PanelInput
          value={selector}
          placeholder="start.files"
          onChange={(event) =>
            patchNodeData({
              variable_selector: event.target.value.split(".").map((item) => item.trim()).filter(Boolean),
              sourceSelector: event.target.value,
            })}
        />
      </PanelField>
      <PanelField label="Array File">
        <PanelInput value={String(data.is_array_file ?? true)} onChange={(event) => patchNodeData({ is_array_file: event.target.value === "true" })} />
      </PanelField>
      <PanelField label="Mode">
        <PanelInput value={data.mode ?? "text"} onChange={(event) => patchNodeData({ mode: event.target.value })} />
      </PanelField>
    </div>
  );
}
