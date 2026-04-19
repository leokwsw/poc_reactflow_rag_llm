import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import { interpolateTemplate } from "@/app/components/workflow/nodes/_base/execution-helpers";

type VariableItem = {
  name: string;
  expression: string;
};

type VariableAssignerNodeData = {
  variables?: VariableItem[];
};

export async function executeVariableAssignerNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as VariableAssignerNodeData;
  const variables = data.variables ?? [];
  const output: Record<string, unknown> = {};

  variables.forEach((item) => {
    output[item.name] = interpolateTemplate(item.expression, context);
  });

  return {
    output,
    detail: `variables=${variables.length}`,
  };
}

