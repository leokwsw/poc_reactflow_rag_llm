"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";
import WorkflowPromptEditor from "../../prompt-editor";

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
        <WorkflowPromptEditor
          value={data.template ?? ""}
          className="font-mono"
          minHeightClassName="min-h-28"
          onChange={(value) => patchNodeData({ template: value })}
        />
      </PanelField>
    </div>
  );
}
