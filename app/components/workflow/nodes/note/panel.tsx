"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";
import WorkflowPromptEditor from "@/app/components/workflow/prompt-editor";

type NoteNodeData = {
  text?: string;
  author?: string;
  theme?: "yellow" | "blue" | "green" | "purple";
};

export default function NotePanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as NoteNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Text">
        <WorkflowPromptEditor
          value={data.text ?? ""}
          minHeightClassName="min-h-28"
          onChange={(value) => patchNodeData({ text: value })}
        />
      </PanelField>
      <PanelField label="Author">
        <PanelInput value={data.author ?? ""} onChange={(event) => patchNodeData({ author: event.target.value })} />
      </PanelField>
      <PanelField label="Theme">
        <PanelInput value={data.theme ?? "yellow"} onChange={(event) => patchNodeData({ theme: event.target.value })} />
      </PanelField>
    </div>
  );
}
