import type {NodeExecutionContext, NodeExecutionResult} from "@/app/components/workflow/nodes/execution-types";

export async function executeNoteNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  return {
    output: {
      text: typeof context.node.data?.content === "string" ? context.node.data.content : "",
    },
    detail: "memo",
  };
}
