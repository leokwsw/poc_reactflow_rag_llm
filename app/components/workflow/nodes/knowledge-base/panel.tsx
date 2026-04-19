"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type KnowledgeBaseNodeData = {
  label?: string;
  indexingTechnique?: string;
  retrievalSearchMethod?: string;
};

export default function KnowledgeBasePanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as KnowledgeBaseNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Knowledge Base"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Indexing Technique">
        <PanelInput value={data.indexingTechnique ?? ""} onChange={(event) => patchNodeData({ indexingTechnique: event.target.value })} />
      </PanelField>
      <PanelField label="Retrieval Search Method">
        <PanelInput value={data.retrievalSearchMethod ?? ""} onChange={(event) => patchNodeData({ retrievalSearchMethod: event.target.value })} />
      </PanelField>
    </div>
  );
}
