"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";
import { Handle, Position } from "reactflow";

type HumanInputNodeData = {
  label?: string;
  variableName?: string;
  required_variables?: string[];
  selectedBranch?: string;
};

export default function HumanInputNode({ data }: NodeProps<HumanInputNodeData>) {
  const requiredVariables = data.required_variables ?? [];

  return (
    <BaseNode title={data.label || "Human Input"} subtitle="Pause point for human confirmation or follow-up" tone="amber" hasTarget hasSource={false}>
      <NodeSection label="Variable">
        <NodeToken>{data.variableName || "human_input"}</NodeToken>
      </NodeSection>
      <NodeSection label="Required Variables">
        <NodeToken>{requiredVariables.length === 0 ? "No requirements" : `${requiredVariables.length} variable${requiredVariables.length === 1 ? "" : "s"}`}</NodeToken>
      </NodeSection>
      <Handle
        type="source"
        id={data.selectedBranch || "source"}
        position={Position.Right}
        className="h-3 w-3 border-2! border-white! bg-amber-500!"
      />
    </BaseNode>
  );
}
