"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";
import type { WorkflowNodeDataBase } from "@/app/components/workflow/nodes/_base/workflow-node-data";

type AgentNodeData = WorkflowNodeDataBase & {
  model?: string;
  messages?: Array<{role?: string; content?: string}>;
  tools?: string[];
};

export default function AgentNode({ data }: NodeProps<AgentNodeData>) {
  const hasModel = Boolean(data.model);
  const messageCount = data.messages?.length ?? 0;
  const tools = data.tools ?? [];

  return (
    <BaseNode title={data.label || "Agent"} tone="indigo" hasTarget hasSource runStatus={data.runStatus}>
      {hasModel ? (
        <>
          <NodeSection label="Model">
            <NodeToken>{data.model}</NodeToken>
          </NodeSection>
          <NodeSection label="Messages">
            <NodeToken>{messageCount || 1} configured</NodeToken>
          </NodeSection>
          <NodeSection label="MCP Tools">
            {tools.length === 0 ? <NodeToken muted>No tools attached</NodeToken> : (
              <div className="space-y-1.5">
                {tools.map((tool) => <NodeToken key={tool}>{tool}</NodeToken>)}
              </div>
            )}
          </NodeSection>
        </>
      ) : (
        <NodeToken muted>No model selected</NodeToken>
      )}
    </BaseNode>
  );
}
