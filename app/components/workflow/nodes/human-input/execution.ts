import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";

type HumanInputNodeData = {
  variableName?: string;
  prompt?: string;
  required_variables?: string[];
  selectedBranch?: string;
  default_value_dict?: Record<string, unknown>;
};

export async function executeHumanInputNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as HumanInputNodeData;
  const variableName = data.variableName || "human_input";
  const selectedBranch = data.selectedBranch || "source";
  const requiredVariables = data.required_variables ?? [];

  return {
    output: {
      [variableName]: context.input.query,
      prompt: data.prompt || "Please provide input",
      query: context.input.query,
      files: context.input.files,
      required_variables: requiredVariables,
      default_value_dict: data.default_value_dict ?? {},
    },
    detail: `variable=${variableName}, branch=${selectedBranch}`,
    selectedSourceHandles: [selectedBranch],
  };
}
