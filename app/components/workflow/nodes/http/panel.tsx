"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type HttpNodeData = {
  label?: string;
  method?: string;
  url?: string;
};

export default function HttpPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as HttpNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "HTTP"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Method">
        <PanelInput value={data.method ?? "GET"} onChange={(event) => patchNodeData({ method: event.target.value })} />
      </PanelField>
      <PanelField label="URL">
        <PanelInput value={data.url ?? ""} onChange={(event) => patchNodeData({ url: event.target.value })} />
      </PanelField>
    </div>
  );
}
