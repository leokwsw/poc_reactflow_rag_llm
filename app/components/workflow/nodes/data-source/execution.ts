import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";

type DataSourceNodeData = {
  variableName?: string;
  sourceType?: string;
};

export async function executeDataSourceNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as DataSourceNodeData;
  const variableName = data.variableName || "source_data";

  return {
    output: {
      [variableName]: context.input.files,
      sourceType: data.sourceType || "File Upload",
      file_count: context.input.files.length,
    },
    detail: `files=${context.input.files.length}`,
  };
}

