"use client";

import type {NodeProps} from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";
import type {WorkflowNodeDataBase} from "@/app/components/workflow/nodes/_base/workflow-node-data";

type ToolNodeData = WorkflowNodeDataBase & {
  tool_id?: string;
  input_mapping?: unknown[];
};

export default function ToolNode({data}: NodeProps<ToolNodeData>) {
  const inputCount = data.input_mapping?.length ?? 0;
  return (
    <BaseNode title={data.label || "Tool"} tone="amber" hasTarget hasSource runStatus={data.runStatus}>
      <NodeSection label="Tool">
        <NodeToken>{data.tool_id || "No tool selected"}</NodeToken>
      </NodeSection>
      <NodeSection label="Inputs">
        <NodeToken muted>{inputCount} mapped inputs</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}

