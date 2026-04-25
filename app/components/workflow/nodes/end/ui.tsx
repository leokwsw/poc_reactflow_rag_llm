"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import ReadonlyTemplateWithVariables from "@/app/components/workflow/nodes/_base/readonly-template-with-variables";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";

type EndNodeData = {
  label?: string;
  outputs?: string[];
  answer?: string;
  runStatus?: "idle" | "running" | "completed" | "error";
};

export default function EndNode({ data }: NodeProps<EndNodeData>) {
  const label = data.label?.trim() || "Answer";
  const templateValue = data.answer ?? (data.outputs ?? []).map(item => `{{#${item}#}}`).join("\n");

  return (
    <BaseNode
      title={label}
      tone="amber"
      hasTarget
      hasSource={false}
      minWidthClassName="w-[260px]"
      runStatus={data.runStatus}
    >
      <NodeSection label="Answer">
        <ReadonlyTemplateWithVariables value={templateValue} />
      </NodeSection>
    </BaseNode>
  );
}
