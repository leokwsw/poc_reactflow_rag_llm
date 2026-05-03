"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";
import type { WorkflowNodeDataBase } from "@/app/components/workflow/nodes/_base/workflow-node-data";

type LoopEndNodeData = WorkflowNodeDataBase & {
  aggregate?: string;
};

export default function LoopEndNode({ data }: NodeProps<LoopEndNodeData>) {
  return (
    <BaseNode title={data.label || "Loop End"} tone="emerald" hasTarget hasSource={false}>
      <NodeSection label="Aggregate">
        <NodeToken>{data.aggregate || "collect_results"}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}
