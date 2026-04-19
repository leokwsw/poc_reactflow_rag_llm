"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type LoopStartNodeData = {
  label?: string;
  scopeName?: string;
};

export default function LoopStartNode({ data }: NodeProps<LoopStartNodeData>) {
  return (
    <BaseNode title={data.label || "Loop Start"} subtitle="Entry to loop body" tone="zinc" hasTarget={false} hasSource>
      <NodeSection label="Scope">
        <NodeToken>{data.scopeName || "loop_scope"}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}

