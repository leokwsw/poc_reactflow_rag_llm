"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";
import type { WorkflowNodeDataBase } from "@/app/components/workflow/nodes/_base/workflow-node-data";

type DataSourceNodeData = WorkflowNodeDataBase & {
  sourceType?: string;
  variableName?: string;
};

export default function DataSourceNode({ data }: NodeProps<DataSourceNodeData>) {
  return (
    <BaseNode title={data.label || "Data Source"} tone="indigo" hasTarget hasSource>
      <NodeSection label="Source">
        <NodeToken>{data.sourceType || "File Upload"}</NodeToken>
      </NodeSection>
      <NodeSection label="Output Variable">
        <NodeToken>{data.variableName || "source_data"}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}
