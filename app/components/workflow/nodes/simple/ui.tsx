"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";

type SimpleNodeData = {
  label?: string;
  description?: string;
};

export default function SimpleNode({ data }: NodeProps<SimpleNodeData>) {
  return (
    <BaseNode title={data.label || "Simple Node"} tone="zinc" hasTarget hasSource={false}>
      <p className="text-xs text-zinc-600">{data.description || "A simple placeholder workflow node."}</p>
    </BaseNode>
  );
}
