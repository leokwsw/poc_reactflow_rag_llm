"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";

type EndNodeData = {
  label?: string;
  outputs?: string[];
  answer?: string;
};

export default function EndNode({ data }: NodeProps<EndNodeData>) {
  const outputs = data.outputs ?? [];
  const answer = data.answer?.trim();

  return (
    <BaseNode title={data.label || "End"} tone="emerald" hasTarget hasSource={false}>
      {answer ? (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-zinc-500">Answer</p>
          <div className="rounded-md bg-zinc-100 px-2 py-1.5 text-xs text-zinc-700">
            {answer}
          </div>
        </div>
      ) : outputs.length === 0 ? (
        <p className="text-xs text-zinc-500">No output variables</p>
      ) : (
        outputs.map((output) => (
          <p key={output} className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
            {output}
          </p>
        ))
      )}
    </BaseNode>
  );
}
