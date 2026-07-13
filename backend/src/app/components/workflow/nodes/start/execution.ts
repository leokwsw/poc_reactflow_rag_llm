import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";

export async function executeStartNode({
  input,
}: NodeExecutionContext): Promise<NodeExecutionResult> {
  return {
    output: {
      query: input.query,
      files: input.files,
    },
    detail: `query=${input.query.length} chars, files=${input.files.length}`,
    traceInput: {
      files: input.files,
      query: input.query,
    },
    traceProcessData: {},
    traceOutput: {
      "sys.files": input.files,
      "sys.query": input.query,
    },
  };
}
