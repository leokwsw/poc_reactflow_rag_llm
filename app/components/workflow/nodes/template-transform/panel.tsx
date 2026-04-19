"use client";

import { PanelField, PanelInput, PanelTextArea } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type TemplateTransformNodeData = {
  label?: string;
  template?: string;
};

export default function TemplateTransformPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as TemplateTransformNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Template Transform"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Template">
        <PanelTextArea className="min-h-28 font-mono" value={data.template ?? ""} onChange={(event) => patchNodeData({ template: event.target.value })} />
      </PanelField>
    </div>
  );
}
