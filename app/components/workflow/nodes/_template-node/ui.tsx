"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";
import type { WorkflowNodeDataBase } from "@/app/components/workflow/nodes/_base/workflow-node-data";

type TemplateNodeData = WorkflowNodeDataBase & {
  input?: string;
};

export default function TemplateNode({ data }: NodeProps<TemplateNodeData>) {
  return (
    <BaseNode title={data.label || "Template Node"} tone="zinc" hasTarget hasSource runStatus={data.runStatus}>
      <NodeSection label="Input">
        <NodeToken>{data.input || "{{#sys.query#}}"}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}
