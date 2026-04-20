import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";

type TriggerWebhookNodeData = {
  webhook_url?: string;
  method?: string;
  content_type?: string;
  headers?: Array<{ name?: string; value?: string }>;
  params?: Array<{ name?: string; type?: string }>;
  body?: Array<{ name?: string; type?: string }>;
  async_mode?: boolean;
  status_code?: number;
  response_body?: string;
};

export async function executeTriggerWebhookNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as TriggerWebhookNodeData;
  const rawWebhookData = {
    query: context.input.query,
    files: context.input.files,
    headers: Object.fromEntries((data.headers ?? []).map((item) => [item.name ?? "", item.value ?? ""])),
  };

  return {
    output: {
      trigger: "webhook",
      method: (data.method || "POST").toUpperCase(),
      webhook_url: data.webhook_url || "",
      content_type: data.content_type || "application/json",
      params: data.params ?? [],
      body: data.body ?? [],
      async_mode: data.async_mode ?? true,
      status_code: data.status_code ?? 200,
      response_body: data.response_body ?? "",
      _webhook_raw: rawWebhookData,
    },
    detail: `trigger=webhook, method=${(data.method || "POST").toUpperCase()}`,
  };
}
