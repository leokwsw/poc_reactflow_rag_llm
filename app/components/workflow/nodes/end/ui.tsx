"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type EndNodeData = {
  label?: string;
  outputs?: string[];
  answer?: string;
};

export default function EndNode({ data }: NodeProps<EndNodeData>) {
  const outputs = data.outputs ?? [];
  const answer = data.answer?.trim();

  return (
    <BaseNode title={data.label || "End"} subtitle="Final return values" tone="emerald" hasTarget hasSource={false}>
      {answer ? (
        <NodeSection label="Answer">
          <div className="rounded-lg border border-zinc-200 bg-zinc-100 px-2.5 py-1.5 text-xs text-zinc-700">
            {answer}
          </div>
        </NodeSection>
      ) : outputs.length === 0 ? (
        <NodeToken muted>No output variables</NodeToken>
      ) : (
        <NodeSection label="Outputs">
          <div className="space-y-1.5">
            {outputs.map((output) => (
              <NodeToken key={output}>{output}</NodeToken>
            ))}
          </div>
        </NodeSection>
      )}
    </BaseNode>
  );
}
