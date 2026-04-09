"use client";

import { Handle, Position, type NodeProps } from "reactflow";

type StartNodeData = {
  label: string;
  variables?: Array<{
    name: string;
    required?: boolean;
    type?: string;
  }>;
};

export default function StartNode({ data }: NodeProps<StartNodeData>) {
  const variables = data.variables ?? [];

  return (
    <div className="min-w-[220px] rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="rounded-t-xl border-b border-zinc-200 bg-zinc-50 px-3 py-2">
        <p className="text-sm font-semibold text-zinc-900">{data.label || "Start"}</p>
      </div>

      <div className="space-y-2 p-3">
        {variables.length === 0 ? (
          <p className="text-xs text-zinc-500">No input variables</p>
        ) : (
          variables.map((variable) => (
            <div
              key={variable.name}
              className="flex items-center justify-between rounded-md bg-zinc-100 px-2 py-1"
            >
              <span className="text-xs text-zinc-700">{variable.name}</span>
              <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                {variable.required ? "required" : variable.type || "string"}
              </span>
            </div>
          ))
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="h-3 w-3 border-2! border-white! bg-zinc-600!"
      />
    </div>
  );
}
