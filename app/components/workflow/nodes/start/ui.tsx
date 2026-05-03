"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import type { WorkflowNodeDataBase } from "@/app/components/workflow/nodes/_base/workflow-node-data";

type StartNodeData = WorkflowNodeDataBase & {
  label: string;
};

export default function StartNode({ data }: NodeProps<StartNodeData>) {
  return (
    <BaseNode title={data.label || "Start"} tone="zinc" hasTarget={false} hasSource runStatus={data.runStatus}/>
  );
}
