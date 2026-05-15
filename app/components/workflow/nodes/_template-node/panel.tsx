"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type TemplateNodeData = {
  label?: string;
  input?: string;
};

export default function TemplatePanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as TemplateNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput
          value={data.label ?? "Template Node"}
          onChange={(event) => patchNodeData({ label: event.target.value })}
        />
      </PanelField>

      <PanelField label="Input">
        <PanelInput
          value={data.input ?? "{{#sys.query#}}"}
          onChange={(event) => patchNodeData({ input: event.target.value })}
        />
      </PanelField>
    </div>
  );
}
