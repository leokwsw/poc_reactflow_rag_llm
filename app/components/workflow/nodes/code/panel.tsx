"use client";

import { PanelField, PanelInput, PanelTextArea } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type CodeNodeData = {
  label?: string;
  language?: string;
  code?: string;
};

export default function CodePanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as CodeNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Code"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Language">
        <PanelInput value={data.language ?? "JavaScript"} onChange={(event) => patchNodeData({ language: event.target.value })} />
      </PanelField>
      <PanelField label="Code">
        <PanelTextArea className="min-h-32 font-mono" value={data.code ?? ""} onChange={(event) => patchNodeData({ code: event.target.value })} />
      </PanelField>
    </div>
  );
}
