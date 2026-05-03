"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";
import type { WorkflowNodeDataBase } from "@/app/components/workflow/nodes/_base/workflow-node-data";

type LlmNodeData = WorkflowNodeDataBase & {
  model?: string;
  tools?: string[];
};

export default function LlmNode({ data }: NodeProps<LlmNodeData>) {
  const hasModel = Boolean(data.model);
  const tools = data.tools ?? [];

  return (
    <BaseNode title={data.label || "LLM"} tone="indigo" hasTarget hasSource runStatus={data.runStatus}>
      {hasModel ? (
        <>
          <NodeSection label="Model">
            <NodeToken>{data.model}</NodeToken>
          </NodeSection>
          {tools.length > 0 ? (
            <NodeSection label="Tools">
              <div className="space-y-1.5">
                {tools.map((tool) => <NodeToken key={tool}>{tool}</NodeToken>)}
              </div>
            </NodeSection>
          ) : null}
        </>
      ) : (
        <NodeToken muted>No model selected</NodeToken>
      )}
    </BaseNode>
  );
}
