import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import { getPrimaryParentOutput } from "@/app/components/workflow/nodes/_base/execution-helpers";

type AgentNodeData = {
  role?: string;
  tools?: string[];
};

export async function executeAgentNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as AgentNodeData;
  const parentOutput = getPrimaryParentOutput(context);

  return {
    output: {
      role: data.role || "General-purpose assistant",
      tools: data.tools ?? [],
      input: parentOutput ?? { query: context.input.query },
      text: `Agent prepared with role "${data.role || "General-purpose assistant"}".`,
    },
    detail: `tools=${(data.tools ?? []).length}`,
  };
}

