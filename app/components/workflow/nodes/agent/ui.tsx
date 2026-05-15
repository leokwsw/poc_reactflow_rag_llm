"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";
import type { WorkflowNodeDataBase } from "@/app/components/workflow/nodes/_base/workflow-node-data";

type AgentNodeData = WorkflowNodeDataBase & {
  model?: string;
  tools?: string[];
};

export default function AgentNode({ data }: NodeProps<AgentNodeData>) {
  const tools = data.tools ?? [];

  return (
    <BaseNode title={data.label || "Agent"} tone="indigo" hasTarget hasSource runStatus={data.runStatus}>
      <NodeSection label="Model">
        <NodeToken>{data.model || "Use environment model"}</NodeToken>
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
