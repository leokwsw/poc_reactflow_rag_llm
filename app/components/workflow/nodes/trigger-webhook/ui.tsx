"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type TriggerWebhookNodeData = {
  label?: string;
  webhook_url?: string;
  method?: string;
  content_type?: string;
  status_code?: number;
};

export default function TriggerWebhookNode({ data }: NodeProps<TriggerWebhookNodeData>) {
  return (
    <BaseNode title={data.label || "Trigger Webhook"} tone="zinc" hasTarget={false} hasSource>
      <NodeSection label="Endpoint">
        <NodeToken>{`${(data.method || "POST").toUpperCase()} ${data.webhook_url || "/workflow/hook"}`}</NodeToken>
      </NodeSection>
      <NodeSection label="Response">
        <NodeToken>{`${data.content_type || "application/json"} / ${data.status_code || 200}`}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}
