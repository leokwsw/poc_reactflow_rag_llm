"use client";

import { Handle, Position, type NodeProps } from "reactflow";

type LlmNodeData = {
  label?: string;
  provider?: string;
  model?: string;
};

export default function LlmNode({ data }: NodeProps<LlmNodeData>) {
  const hasModel = Boolean(data.provider && data.model);

  return (
    <div className="min-w-[220px] rounded-xl border border-indigo-200 bg-white shadow-sm">
      <div className="rounded-t-xl border-b border-indigo-200 bg-indigo-50 px-3 py-2">
        <p className="text-sm font-semibold text-indigo-900">{data.label || "LLM"}</p>
      </div>

      <div className="space-y-1 p-3">
        {hasModel ? (
          <>
            <p className="text-xs text-zinc-500">Provider</p>
            <p className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
              {data.provider}
            </p>
            <p className="mt-2 text-xs text-zinc-500">Model</p>
            <p className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
              {data.model}
            </p>
          </>
        ) : (
          <p className="text-xs text-zinc-500">No model selected</p>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="h-3 w-3 border-2! border-white! bg-indigo-600!"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="h-3 w-3 border-2! border-white! bg-indigo-600!"
      />
    </div>
  );
}
