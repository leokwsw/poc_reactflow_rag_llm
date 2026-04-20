"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type TriggerWebhookNodeData = {
  label?: string;
  webhook_url?: string;
  method?: string;
  content_type?: string;
  status_code?: number;
  response_body?: string;
};

export default function TriggerWebhookPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as TriggerWebhookNodeData;

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Trigger Webhook"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Method">
        <PanelInput value={data.method ?? "POST"} onChange={(event) => patchNodeData({ method: event.target.value.toUpperCase() })} />
      </PanelField>
      <PanelField label="Webhook URL">
        <PanelInput value={data.webhook_url ?? ""} placeholder="https://example.com/webhook" onChange={(event) => patchNodeData({ webhook_url: event.target.value })} />
      </PanelField>
      <PanelField label="Content Type">
        <PanelInput value={data.content_type ?? "application/json"} onChange={(event) => patchNodeData({ content_type: event.target.value })} />
      </PanelField>
      <PanelField label="Status Code">
        <PanelInput value={String(data.status_code ?? 200)} onChange={(event) => patchNodeData({ status_code: Number(event.target.value) || 200 })} />
      </PanelField>
      <PanelField label="Response Body">
        <PanelInput value={data.response_body ?? ""} onChange={(event) => patchNodeData({ response_body: event.target.value })} />
      </PanelField>
    </div>
  );
}
