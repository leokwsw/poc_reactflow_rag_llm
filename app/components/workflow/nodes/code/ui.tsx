"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type CodeNodeData = {
  label?: string;
  language?: string;
  code?: string;
};

export default function CodeNode({ data }: NodeProps<CodeNodeData>) {
  const code = data.code || "return { result: input };";
  const lineCount = code.split("\n").filter((line) => line.trim()).length;

  return (
    <BaseNode title={data.label || "Code"} subtitle="Execute custom logic" tone="amber" hasTarget hasSource>
      <NodeSection label="Runtime">
        <NodeToken>{data.language || "JavaScript"}</NodeToken>
      </NodeSection>
      <NodeSection label="Script">
        <NodeToken>{`${lineCount} line${lineCount === 1 ? "" : "s"}`}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}
