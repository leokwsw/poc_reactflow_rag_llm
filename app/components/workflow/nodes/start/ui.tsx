"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";

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
    <BaseNode title={data.label || "Start"} tone="zinc" hasTarget={false} hasSource>
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
    </BaseNode>
  );
}

