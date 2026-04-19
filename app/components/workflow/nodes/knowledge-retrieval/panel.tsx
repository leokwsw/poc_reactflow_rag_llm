"use client";

import { PanelButton, PanelCard, PanelField, PanelInlineActions, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type Dataset = {
  id: string;
  name: string;
};

type KnowledgeRetrievalNodeData = {
  label?: string;
  datasets?: Dataset[];
};

export default function KnowledgeRetrievalPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as KnowledgeRetrievalNodeData;
  const datasets = data.datasets ?? [];

  return (
    <div className="space-y-4">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Knowledge Retrieval"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      {datasets.map((dataset, index) => (
        <PanelCard key={`${dataset.id}-${index}`}>
          <PanelInlineActions>
            <PanelButton
              className="w-auto border-0 p-0"
              danger
              onClick={() => patchNodeData({ datasets: datasets.filter((_, itemIndex) => itemIndex !== index) })}
            >
              Remove
            </PanelButton>
          </PanelInlineActions>
          <PanelInput
            placeholder="Dataset ID"
            value={dataset.id}
            onChange={(event) =>
              patchNodeData({
                datasets: datasets.map((item, itemIndex) => (itemIndex === index ? { ...item, id: event.target.value } : item)),
              })
            }
          />
          <PanelInput
            placeholder="Dataset Name"
            value={dataset.name}
            onChange={(event) =>
              patchNodeData({
                datasets: datasets.map((item, itemIndex) => (itemIndex === index ? { ...item, name: event.target.value } : item)),
              })
            }
          />
        </PanelCard>
      ))}
      <PanelButton onClick={() => patchNodeData({ datasets: [...datasets, { id: "", name: "" }] })}>Add Dataset</PanelButton>
    </div>
  );
}
