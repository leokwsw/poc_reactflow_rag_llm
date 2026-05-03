"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import type { WorkflowNodeDataBase } from "@/app/components/workflow/nodes/_base/workflow-node-data";

type SimpleNodeData = WorkflowNodeDataBase & {
  description?: string;
};

export default function SimpleNode({ data }: NodeProps<SimpleNodeData>) {
  return (
    <BaseNode title={data.label || "Simple Node"} tone="zinc" hasTarget hasSource={false}>
      <NodeSection label="Description">
        <p className="text-xs text-zinc-600">{data.description || "A simple placeholder workflow node."}</p>
      </NodeSection>
    </BaseNode>
  );
}
