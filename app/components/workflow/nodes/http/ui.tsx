"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type HttpNodeData = {
  label?: string;
  method?: string;
  url?: string;
};

export default function HttpNode({ data }: NodeProps<HttpNodeData>) {
  return (
    <BaseNode title={data.label || "HTTP"} subtitle="Call an external HTTP endpoint" tone="amber" hasTarget hasSource>
      <NodeSection label="Request">
        <NodeToken>{`${data.method || "GET"} ${data.url || "https://api.example.com"}`}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}

