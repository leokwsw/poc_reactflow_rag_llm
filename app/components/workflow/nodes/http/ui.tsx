"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";
import type { WorkflowNodeDataBase } from "@/app/components/workflow/nodes/_base/workflow-node-data";

type HttpNodeData = WorkflowNodeDataBase & {
  method?: string;
  url?: string;
  body_type?: string;
  headers?: unknown[];
  params?: unknown[];
};

export default function HttpNode({ data }: NodeProps<HttpNodeData>) {
  const headerCount = data.headers?.length ?? 0;
  const paramCount = data.params?.length ?? 0;

  return (
    <BaseNode title={data.label || "HTTP"} tone="amber" hasTarget hasSource>
      <NodeSection label="Request">
        <NodeToken>{`${data.method || "GET"} ${data.url || "https://api.example.com"}`}</NodeToken>
      </NodeSection>
      <NodeSection label="Config">
        <div className="space-y-1.5">
          <NodeToken>{`Body: ${data.body_type || "none"}`}</NodeToken>
          <NodeToken muted>{`${headerCount} headers, ${paramCount} params`}</NodeToken>
        </div>
      </NodeSection>
    </BaseNode>
  );
}
