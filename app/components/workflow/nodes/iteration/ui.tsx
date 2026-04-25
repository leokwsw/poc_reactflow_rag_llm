"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type IterationNodeData = {
  label?: string;
  iterator?: string;
  itemName?: string;
};

export default function IterationNode({ data }: NodeProps<IterationNodeData>) {
  return (
    <BaseNode title={data.label || "Iteration"} tone="amber" hasTarget hasSource>
      <NodeSection label="Loop Source">
        <NodeToken>{data.iterator || "items"}</NodeToken>
      </NodeSection>
      <NodeSection label="Item Alias">
        <NodeToken>{data.itemName || "item"}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}
