"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type KnowledgeRetrievalNodeData = {
  label?: string;
  datasets?: Array<{
    id: string;
    name: string;
  }>;
};

export default function KnowledgeRetrievalNode({ data }: NodeProps<KnowledgeRetrievalNodeData>) {
  const datasets = data.datasets ?? [];

  return (
    <BaseNode title={data.label || "Knowledge Retrieval"} tone="indigo" hasTarget hasSource>
      <NodeSection label="Datasets">
        {datasets.length === 0 ? (
          <NodeToken muted>No datasets selected</NodeToken>
        ) : (
          <div className="space-y-1.5">
            {datasets.map((dataset) => (
              <NodeToken key={dataset.id}>{dataset.name}</NodeToken>
            ))}
          </div>
        )}
      </NodeSection>
    </BaseNode>
  );
}
