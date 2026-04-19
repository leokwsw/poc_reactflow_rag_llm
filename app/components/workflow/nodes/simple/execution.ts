import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";

type SimpleNodeData = {
  description?: string;
};

export async function executeSimpleNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as SimpleNodeData;

  return {
    output: {
      description: data.description || "",
    },
    detail: "simple",
  };
}

