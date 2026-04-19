import type { NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";

export async function executeDataSourceEmptyNode(): Promise<NodeExecutionResult> {
  return {
    output: {
      source_data: [],
      file_count: 0,
    },
    detail: "empty-source",
  };
}
