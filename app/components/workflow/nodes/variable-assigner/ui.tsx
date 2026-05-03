"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";
import type { WorkflowNodeDataBase } from "@/app/components/workflow/nodes/_base/workflow-node-data";

type VariableAssignerItem = {
  name: string;
  expression: string;
};

type VariableAssignerNodeData = WorkflowNodeDataBase & {
  variables?: VariableAssignerItem[];
};

export default function VariableAssignerNode({ data }: NodeProps<VariableAssignerNodeData>) {
  const variables = data.variables ?? [];
  const firstName = variables[0]?.name;

  return (
    <BaseNode title={data.label || "Variable Assigner"} tone="zinc" hasTarget hasSource>
      <NodeSection label="Count">
        <NodeToken>{`${variables.length} variable${variables.length === 1 ? "" : "s"}`}</NodeToken>
      </NodeSection>
      <NodeSection label="First Variable">
        <NodeToken muted={!firstName}>{firstName || "No variables configured"}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}
