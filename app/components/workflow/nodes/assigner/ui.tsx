"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type AssignerItem = {
  target: string;
  value: string;
};

type AssignerNodeData = {
  label?: string;
  assignments?: AssignerItem[];
};

export default function AssignerNode({ data }: NodeProps<AssignerNodeData>) {
  const assignments = data.assignments ?? [];
  const firstTarget = assignments[0]?.target;

  return (
    <BaseNode title={data.label || "Assigner"} tone="zinc" hasTarget hasSource>
      <NodeSection label="Count">
        <NodeToken>{`${assignments.length} assignment${assignments.length === 1 ? "" : "s"}`}</NodeToken>
      </NodeSection>
      <NodeSection label="First Target">
        <NodeToken muted={!firstTarget}>{firstTarget || "No assignments configured"}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}
