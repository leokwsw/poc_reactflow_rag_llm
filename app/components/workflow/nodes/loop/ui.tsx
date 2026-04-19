"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type LoopNodeData = {
  label?: string;
  condition?: string;
  maxIterations?: number;
};

export default function LoopNode({ data }: NodeProps<LoopNodeData>) {
  return (
    <BaseNode title={data.label || "Loop"} subtitle="Repeat until condition is met" tone="amber" hasTarget hasSource>
      <NodeSection label="Condition">
        <NodeToken>{data.condition || "count < 10"}</NodeToken>
      </NodeSection>
      <NodeSection label="Max Iterations">
        <NodeToken>{String(data.maxIterations ?? 10)}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}

