"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type VariableAssignerItem = {
  name: string;
  expression: string;
};

type VariableAssignerNodeData = {
  label?: string;
  variables?: VariableAssignerItem[];
};

export default function VariableAssignerNode({ data }: NodeProps<VariableAssignerNodeData>) {
  const variables = data.variables ?? [];

  return (
    <BaseNode title={data.label || "Variable Assigner"} subtitle="Create or overwrite variables" tone="zinc" hasTarget hasSource>
      <NodeSection label="Variables">
        {variables.length === 0 ? <NodeToken muted>No variables configured</NodeToken> : (
          <div className="space-y-1.5">
            {variables.map((item) => <NodeToken key={item.name}>{item.name} = {item.expression}</NodeToken>)}
          </div>
        )}
      </NodeSection>
    </BaseNode>
  );
}

