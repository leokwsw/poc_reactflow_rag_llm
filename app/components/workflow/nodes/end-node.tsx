"use client";

import { Handle, Position, type NodeProps } from "reactflow";

type EndNodeData = {
  label?: string;
  outputs?: string[];
};

export default function EndNode({ data }: NodeProps<EndNodeData>) {
  const outputs = data.outputs ?? [];

  return (
    <div className="min-w-[220px] rounded-xl border border-emerald-200 bg-white shadow-sm">
      <div className="rounded-t-xl border-b border-emerald-200 bg-emerald-50 px-3 py-2">
        <p className="text-sm font-semibold text-emerald-900">{data.label || "End"}</p>
      </div>

      <div className="space-y-2 p-3">
        {outputs.length === 0 ? (
          <p className="text-xs text-zinc-500">No output variables</p>
        ) : (
          outputs.map((output) => (
            <p key={output} className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
              {output}
            </p>
          ))
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="h-3 w-3 border-2! border-white! bg-emerald-600!"
      />
    </div>
  );
}
