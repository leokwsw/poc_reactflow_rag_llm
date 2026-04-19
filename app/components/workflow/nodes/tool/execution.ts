import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";

type ToolNodeData = {
  toolName?: string;
};

export async function executeToolNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as ToolNodeData;

  return {
    output: {
      tool_name: data.toolName || "web_search",
      result: `Tool ${data.toolName || "web_search"} prepared for query "${context.input.query}".`,
    },
    detail: `tool=${data.toolName || "web_search"}`,
  };
}

