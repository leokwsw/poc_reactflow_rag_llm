"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type KnowledgeBaseNodeData = {
  label?: string;
  indexingTechnique?: string;
  retrievalSearchMethod?: string;
};

export default function KnowledgeBaseNode({ data }: NodeProps<KnowledgeBaseNodeData>) {
  return (
    <BaseNode title={data.label || "Knowledge Base"} tone="indigo" hasTarget hasSource>
      <NodeSection label="Index Mode">
        <NodeToken>{data.indexingTechnique || "high_quality"}</NodeToken>
      </NodeSection>
      <NodeSection label="Retrieval">
        <NodeToken>{data.retrievalSearchMethod || "semantic_search"}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}
