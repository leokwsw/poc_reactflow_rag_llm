"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";
import WorkflowPromptEditor from "../../prompt-editor";

type SimpleNodeData = {
  label?: string;
  description?: string;
};

export default function SimplePanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as SimpleNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Simple Node"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Description">
        <WorkflowPromptEditor
          value={data.description ?? ""}
          minHeightClassName="min-h-24"
          onChange={(value) => patchNodeData({ description: value })}
        />
      </PanelField>
    </div>
  );
}
