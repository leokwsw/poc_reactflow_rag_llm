"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import type { WorkflowNodeDataBase } from "@/app/components/workflow/nodes/_base/workflow-node-data";

type IfElseCase = {
  id: string;
  label: string;
  logical_operator?: "and" | "or";
  conditions?: Array<string | {
    left?: string;
    operator?: string;
    right?: string;
  }>;
};

type IfElseNodeData = WorkflowNodeDataBase & {
  cases?: IfElseCase[];
};

export default function IfElseNode({ data }: NodeProps<IfElseNodeData>) {
  const cases = data.cases ?? [];
  const branchCount = cases.length + 1; // +1 for ELSE
  const describeCondition = (condition: NonNullable<IfElseCase["conditions"]>[number]) => {
    if (typeof condition === "string") {
      return condition;
    }
    const operator = condition.operator ?? "includes";
    if (operator === "is_empty" || operator === "is_not_empty") {
      return `${condition.left ?? ""} ${operator}`;
    }
    return `${condition.left ?? ""} ${operator} ${condition.right ?? ""}`;
  };

  return (
    <BaseNode title={data.label || "If / Else"} tone="amber" hasTarget hasSource={false} runStatus={data.runStatus}>
      <NodeSection label="Branches">
      <div className="space-y-2">
        {cases.map((branch, index) => {
          const top = ((index + 1) / (branchCount + 1)) * 100;
          return (
            <div key={branch.id} className="relative rounded-lg border border-zinc-200 bg-zinc-100 p-2.5">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-zinc-500">
                  {index === 0 ? "IF" : `ELIF ${index}`}
                </span>
                <span className="text-[10px] text-zinc-500">{branch.label}</span>
              </div>
              <div className="space-y-1">
                {(branch.conditions ?? []).length > 0 ? (
                  (branch.conditions ?? []).map((condition, conditionIndex) => (
                    <p key={`${branch.id}-${conditionIndex}`} className="truncate text-xs text-zinc-700">
                      {conditionIndex > 0 ? `${(branch.logical_operator ?? "and").toUpperCase()} ` : ""}
                      {describeCondition(condition)}
                    </p>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500">Condition not set</p>
                )}
              </div>
              <Handle
                type="source"
                id={branch.id}
                position={Position.Right}
                style={{ top: `${top}%` }}
                className="h-3 w-3 border-2! border-black! bg-zinc-600!"
              />
            </div>
          );
        })}

        <div className="relative rounded-lg border border-dashed border-zinc-300 px-2.5 py-1.5">
          <p className="text-xs font-semibold text-zinc-600">ELSE</p>
          <Handle
            type="source"
            id="else"
            position={Position.Right}
            style={{ top: `${(branchCount / (branchCount + 1)) * 100}%` }}
            className="h-3 w-3 border-2! border-black! bg-zinc-600!"
          />
        </div>
      </div>
      </NodeSection>
    </BaseNode>
  );
}
