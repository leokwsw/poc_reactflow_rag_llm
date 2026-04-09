"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";

type LlmNodeData = {
  label?: string;
  provider?: string;
  model?: string;
};

export default function LlmNode({ data }: NodeProps<LlmNodeData>) {
  const hasModel = Boolean(data.provider && data.model);

  return (
    <BaseNode title={data.label || "LLM"} tone="indigo" hasTarget hasSource>
      {hasModel ? (
        <>
          <p className="text-xs text-zinc-500">Provider</p>
          <p className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700">{data.provider}</p>
          <p className="mt-2 text-xs text-zinc-500">Model</p>
          <p className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700">{data.model}</p>
        </>
      ) : (
        <p className="text-xs text-zinc-500">No model selected</p>
      )}
    </BaseNode>
  );
}
