"use client";

import { Handle, Position, type NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";
import type { WorkflowNodeDataBase } from "@/app/components/workflow/nodes/_base/workflow-node-data";

type QuestionClass = {
  id: string;
  name: string;
};

type QuestionClassifierNodeData = WorkflowNodeDataBase & {
  model?: string;
  classes?: QuestionClass[];
};

export default function QuestionClassifierNode({ data }: NodeProps<QuestionClassifierNodeData>) {
  const classes = data.classes ?? [];
  const branchCount = Math.max(classes.length, 1);

  return (
    <BaseNode
      title={data.label || "Question Classifier"}
      tone="amber"
      hasTarget
      hasSource={false}
      runStatus={data.runStatus}
    >
      <NodeSection label="Model">
        <NodeToken>{data.model || "No model selected"}</NodeToken>
      </NodeSection>
      <NodeSection label="Classes">
        {classes.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-500">
            No classes configured
          </div>
        ) : (
          <div className="space-y-1.5 pr-6">
            {classes.map((item, index) => (
              <div key={item.id} className="relative rounded-lg border border-zinc-200 bg-zinc-100 px-2.5 py-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Class {index + 1}
                  </span>
                  <span className="truncate text-xs font-medium text-zinc-700">{item.name || "Untitled"}</span>
                </div>
                <Handle
                  type="source"
                  id={item.id}
                  position={Position.Right}
                  style={{ top: `${((index + 1) / (branchCount + 1)) * 100}%` }}
                  className="h-3 w-3 border-2! border-black! bg-amber-500!"
                />
              </div>
            ))}
          </div>
        )}
      </NodeSection>
    </BaseNode>
  );
}
