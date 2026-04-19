"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";

type CodeNodeData = {
  label?: string;
  language?: string;
  code?: string;
};

export default function CodeNode({ data }: NodeProps<CodeNodeData>) {
  return (
    <BaseNode title={data.label || "Code"} subtitle="Execute custom logic" tone="amber" hasTarget hasSource>
      <NodeSection label="Runtime">
        <p className="text-xs text-zinc-600">{data.language || "JavaScript"}</p>
      </NodeSection>
      <NodeSection label="Snippet">
        <pre className="line-clamp-4 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 px-2.5 py-2 text-xs text-zinc-700">
          {data.code || "return { result: input };"}
        </pre>
      </NodeSection>
    </BaseNode>
  );
}

