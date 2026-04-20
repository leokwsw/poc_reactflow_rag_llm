"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type VariableAggregatorItem = {
  expression: string;
};

type VariableAggregatorNodeData = {
  label?: string;
  output_type?: string;
  variables?: Array<VariableAggregatorItem | string[]>;
  advanced_settings?: {
    group_enabled?: boolean;
    groups?: Array<{
      group_name?: string;
      variables?: string[][];
    }>;
  };
};

export default function VariableAggregatorNode({ data }: NodeProps<VariableAggregatorNodeData>) {
  const variables = data.variables ?? [];
  const groupEnabled = data.advanced_settings?.group_enabled ?? false;
  const groups = data.advanced_settings?.groups ?? [];
  const itemCount = groupEnabled ? groups.length : variables.length;

  return (
    <BaseNode title={data.label || "Variable Aggregator"} subtitle={`Output: ${data.output_type || "string"}`} tone="emerald" hasTarget hasSource>
      <NodeSection label={groupEnabled ? "Groups" : "Variables"}>
        <NodeToken>{itemCount === 0 ? `No ${groupEnabled ? "groups" : "variables"} configured` : `${itemCount} ${groupEnabled ? "group" : "variable"}${itemCount === 1 ? "" : "s"}`}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}
