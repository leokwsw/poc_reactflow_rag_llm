"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type AssignerItem = {
  target: string;
  value: string;
};

type AssignerNodeData = {
  label?: string;
  assignments?: AssignerItem[];
};

export default function AssignerNode({ data }: NodeProps<AssignerNodeData>) {
  const assignments = data.assignments ?? [];

  return (
    <BaseNode title={data.label || "Assigner"} subtitle="Map values into variables" tone="zinc" hasTarget hasSource>
      <NodeSection label="Assignments">
        {assignments.length === 0 ? <NodeToken muted>No assignments configured</NodeToken> : (
          <div className="space-y-1.5">
            {assignments.map((item, index) => (
              <NodeToken key={`${item.target}-${index}`}>{item.target} = {item.value}</NodeToken>
            ))}
          </div>
        )}
      </NodeSection>
    </BaseNode>
  );
}

