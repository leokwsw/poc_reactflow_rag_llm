"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type AgentNodeData = {
  label?: string;
  role?: string;
  tools?: string[];
};

export default function AgentNode({ data }: NodeProps<AgentNodeData>) {
  const tools = data.tools ?? [];

  return (
    <BaseNode title={data.label || "Agent"} subtitle="Autonomous task agent" tone="indigo" hasTarget hasSource>
      <NodeSection label="Role">
        <NodeToken>{data.role || "General-purpose assistant"}</NodeToken>
      </NodeSection>
      <NodeSection label="Tools">
        {tools.length === 0 ? <NodeToken muted>No tools attached</NodeToken> : (
          <div className="space-y-1.5">
            {tools.map((tool) => <NodeToken key={tool}>{tool}</NodeToken>)}
          </div>
        )}
      </NodeSection>
    </BaseNode>
  );
}

