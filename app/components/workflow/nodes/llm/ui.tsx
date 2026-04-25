"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type LlmNodeData = {
  label?: string;
  apiBaseUrl?: string;
  model?: string;
  tools?: string[];
  runStatus?: "idle" | "running" | "completed" | "error";
};

export default function LlmNode({ data }: NodeProps<LlmNodeData>) {
  const hasModel = Boolean(data.model);
  const tools = data.tools ?? [];

  return (
    <BaseNode title={data.label || "LLM"} subtitle="Model call and prompt execution" tone="indigo" hasTarget hasSource runStatus={data.runStatus}>
      {hasModel ? (
        <>
          <NodeSection label="Model">
            <NodeToken>{data.model}</NodeToken>
          </NodeSection>
          {tools.length > 0 ?? (
            <NodeSection label="Tools">
              <div className="space-y-1.5">
                {tools.map((tool) => <NodeToken key={tool}>{tool}</NodeToken>)}
              </div>
            </NodeSection>
          )}

        </>
      ) : (
        <NodeToken muted>No model selected</NodeToken>
      )}
    </BaseNode>
  );
}
