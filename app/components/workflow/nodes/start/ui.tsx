"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";

type StartNodeData = {
  label: string;
  runStatus?: "idle" | "running" | "completed" | "error";
};

export default function StartNode({ data }: NodeProps<StartNodeData>) {
  return (
    <BaseNode title={data.label || "Start"} tone="zinc" hasTarget={false} hasSource runStatus={data.runStatus}/>
  );
}
