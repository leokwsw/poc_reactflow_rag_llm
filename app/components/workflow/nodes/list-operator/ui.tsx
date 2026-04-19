"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type ListOperatorNodeData = {
  label?: string;
  operation?: string;
  targetList?: string;
};

export default function ListOperatorNode({ data }: NodeProps<ListOperatorNodeData>) {
  return (
    <BaseNode title={data.label || "List Operator"} subtitle="Transform or filter a list" tone="amber" hasTarget hasSource>
      <NodeSection label="Operation">
        <NodeToken>{data.operation || "map"}</NodeToken>
      </NodeSection>
      <NodeSection label="Target List">
        <NodeToken>{data.targetList || "items"}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}

