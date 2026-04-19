import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import { interpolateTemplate } from "@/app/components/workflow/nodes/_base/execution-helpers";

type HttpNodeData = {
  method?: string;
  url?: string;
};

export async function executeHttpNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as HttpNodeData;
  const url = interpolateTemplate(data.url || "", context);
  const method = (data.method || "GET").toUpperCase();

  if (!url)
    throw new Error(`HTTP node "${context.node.id}" is missing url.`);

  const response = await fetch(url, { method });
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return {
    output: {
      status_code: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body,
    },
    detail: `${method} ${response.status}`,
  };
}

