import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";

type NoteNodeData = {
  text?: string;
  author?: string;
};

export async function executeNoteNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as NoteNodeData;

  return {
    output: {
      note: data.text || "",
      author: data.author || "",
    },
    detail: "note",
  };
}

