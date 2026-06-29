"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";
import type { WorkflowNodeDataBase } from "@/app/components/workflow/nodes/_base/workflow-node-data";

type KnowledgeRetrievalNodeData = WorkflowNodeDataBase & {
  datasets?: Array<{
    id: string;
    name: string;
  }>;
  retrieval_sources?: string[];
};

export default function KnowledgeRetrievalNode({ data }: NodeProps<KnowledgeRetrievalNodeData>) {
  const datasets = data.datasets ?? [];
  const sources = data.retrieval_sources?.length ? data.retrieval_sources : ["vector", "bm25", "neo4j", "arangodb"];

  return (
    <BaseNode
      title={data.label || "Knowledge Retrieval"}
      tone="indigo"
      hasTarget
      hasSource
      runStatus={data.runStatus}
    >
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
      <NodeSection label="Sources">
        <div className="flex flex-wrap gap-1.5">
          {sources.map((source) => (
            <NodeToken key={source}>{source}</NodeToken>
          ))}
        </div>
      </NodeSection>
    </BaseNode>
  );
}
