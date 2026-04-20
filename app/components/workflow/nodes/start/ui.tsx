"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type StartNodeData = {
  label: string;
  variables?: Array<{
    name: string;
    required?: boolean;
    type?: string;
  }>;
  runStatus?: "idle" | "running" | "completed" | "error";
};

export default function StartNode({ data }: NodeProps<StartNodeData>) {
  const variables = data.variables ?? [];

  return (
    <BaseNode title={data.label || "Start"} subtitle="Entry point and input variables" tone="zinc" hasTarget={false} hasSource runStatus={data.runStatus}>
      <NodeSection label="Inputs">
        {variables.length === 0 ? (
          <NodeToken muted>No input variables</NodeToken>
        ) : (
          variables.map((variable) => (
            <div
              key={variable.name}
              className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-100 px-2.5 py-1.5"
            >
              <span className="text-xs font-medium text-zinc-700">{variable.name}</span>
              <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                {variable.required ? "required" : variable.type || "string"}
              </span>
            </div>
          ))
        )}
      </NodeSection>
    </BaseNode>
  );
}
