"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type ToolNodeData = {
  label?: string;
  toolName?: string;
  outputSchema?: string[];
};

export default function ToolNode({ data }: NodeProps<ToolNodeData>) {
  const outputSchema = data.outputSchema ?? [];

  return (
    <BaseNode title={data.label || "Tool"} subtitle="Invoke an external tool capability" tone="indigo" hasTarget hasSource>
      <NodeSection label="Tool">
        <NodeToken>{data.toolName || "web_search"}</NodeToken>
      </NodeSection>
      <NodeSection label="Schema">
        <NodeToken>{outputSchema.length === 0 ? "No schema defined" : `${outputSchema.length} field${outputSchema.length === 1 ? "" : "s"}`}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}
