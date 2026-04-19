"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";

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
    <BaseNode title={data.label || "LLM"} tone="indigo" hasTarget hasSource>
      {hasModel ? (
        <>
          <p className="text-xs text-zinc-500">Base URL</p>
          <p className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
            {data.apiBaseUrl || "https://api.openai.com/v1"}
          </p>
          <p className="mt-2 text-xs text-zinc-500">Model</p>
          <p className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700">{data.model}</p>
          {data.systemPrompt && (
            <>
              <p className="mt-2 text-xs text-zinc-500">System Prompt</p>
              <p className="line-clamp-3 rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
                {data.systemPrompt}
              </p>
            </>
          )}
        </>
      ) : (
        <p className="text-xs text-zinc-500">No model selected</p>
      )}
    </BaseNode>
  );
}

