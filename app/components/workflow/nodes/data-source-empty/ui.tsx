"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type DataSourceEmptyNodeData = {
  label?: string;
  message?: string;
};

export default function DataSourceEmptyNode({ data }: NodeProps<DataSourceEmptyNodeData>) {
  return (
    <BaseNode title={data.label || "Data Source Empty"} tone="zinc" hasTarget hasSource>
      <NodeSection label="State">
        <NodeToken>{data.message || "Waiting for data source selection"}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}
