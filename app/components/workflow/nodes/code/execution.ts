import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";

type CodeNodeData = {
  code?: string;
};

export async function executeCodeNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as CodeNodeData;
  const code = data.code || "return { result: query };";

  try {
    const executor = new Function("query", "files", "outputs", code);
    const result = executor(context.input.query, context.input.files, context.nodeOutputs);

    return {
      output: result && typeof result === "object" ? result as Record<string, unknown> : { result },
      detail: "code-executed",
    };
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Code execution failed.");
  }
}

