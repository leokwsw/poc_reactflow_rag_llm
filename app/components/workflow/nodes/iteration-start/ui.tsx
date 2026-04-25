"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type IterationStartNodeData = {
  label?: string;
  scopeName?: string;
};

export default function IterationStartNode({ data }: NodeProps<IterationStartNodeData>) {
  return (
    <BaseNode title={data.label || "Iteration Start"} tone="zinc" hasTarget={false} hasSource>
      <NodeSection label="Scope">
        <NodeToken>{data.scopeName || "iteration_scope"}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}
