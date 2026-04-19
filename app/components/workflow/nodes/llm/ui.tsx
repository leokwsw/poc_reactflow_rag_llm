"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type LlmNodeData = {
  label?: string;
  provider?: string;
  apiBaseUrl?: string;
  model?: string;
  systemPrompt?: string;
};

export default function LlmNode({ data }: NodeProps<LlmNodeData>) {
  const hasModel = Boolean(data.model);

  return (
    <BaseNode title={data.label || "LLM"} subtitle="Model call and prompt execution" tone="indigo" hasTarget hasSource>
      {hasModel ? (
        <>
          <NodeSection label="Endpoint">
            <NodeToken>{data.apiBaseUrl || "https://api.openai.com/v1"}</NodeToken>
          </NodeSection>
          <NodeSection label="Model">
            <NodeToken>{data.model}</NodeToken>
          </NodeSection>
          {data.systemPrompt && (
            <NodeSection label="System Prompt">
              <p className="line-clamp-3 rounded-lg border border-zinc-200 bg-zinc-100 px-2.5 py-1.5 text-xs text-zinc-700">
                {data.systemPrompt}
              </p>
            </NodeSection>
          )}
        </>
      ) : (
        <NodeToken muted>No model selected</NodeToken>
      )}
    </BaseNode>
  );
}
