"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";

type AnswerNodeData = {
  label?: string;
  answer?: string;
};

export default function AnswerNode({ data }: NodeProps<AnswerNodeData>) {
  return (
    <BaseNode title={data.label || "Answer"} tone="emerald" hasTarget hasSource={false}>
      <div className="space-y-1">
        <p className="text-xs font-semibold text-zinc-500">Answer</p>
        <div className="rounded-md bg-zinc-100 px-2 py-1.5 text-xs text-zinc-700">
          {data.answer || "{{llm.text}}"}
        </div>
      </div>
    </BaseNode>
  );
}
