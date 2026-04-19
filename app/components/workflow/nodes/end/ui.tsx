"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";

type EndNodeData = {
  label?: string;
  outputs?: string[];
};

export default function EndNode({ data }: NodeProps<EndNodeData>) {
  const outputs = data.outputs ?? [];

  return (
    <BaseNode title={data.label || "End"} tone="emerald" hasTarget hasSource={false}>
      {outputs.length === 0 ? (
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

