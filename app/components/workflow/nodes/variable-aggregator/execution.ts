import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import { resolveExpression } from "@/app/components/workflow/nodes/execution-utils";

type VariableAggregatorItem = {
  expression: string;
};

type VariableAggregatorNodeData = {
  output_type?: string;
  variables?: Array<VariableAggregatorItem | string[]>;
  advanced_settings?: {
    group_enabled?: boolean;
    groups?: Array<{
      group_name?: string;
      variables?: string[][];
    }>;
  };
};

function resolveVariableItem(item: VariableAggregatorItem | string[], context: NodeExecutionContext) {
  if (Array.isArray(item))
    return resolveExpression(item.join("."), context.nodeOutputs, context.aliasMap);

  return resolveExpression(item.expression.replace(/^\{\{|\}\}$/g, ""), context.nodeOutputs, context.aliasMap);
}

export async function executeVariableAggregatorNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as VariableAggregatorNodeData;
  const advancedSettings = data.advanced_settings ?? { group_enabled: false, groups: [] };

  if (advancedSettings.group_enabled) {
    const groupedOutput: Record<string, unknown> = {};

    (advancedSettings.groups ?? []).forEach((group) => {
      const resolved = (group.variables ?? [])
        .map((item) => resolveExpression(item.join("."), context.nodeOutputs, context.aliasMap))
        .find((value) => value !== undefined && value !== null && String(value).trim() !== "");

      if (group.group_name)
        groupedOutput[group.group_name] = { output: resolved };
    });

    return {
      output: groupedOutput,
      detail: `groups=${Object.keys(groupedOutput).length}`,
    };
  }

  const resolved = (data.variables ?? [])
    .map((item) => resolveVariableItem(item, context))
    .find((value) => value !== undefined && value !== null && String(value).trim() !== "");

  if (data.output_type === "array") {
    const items = (data.variables ?? []).map((item) => resolveVariableItem(item, context));
    return {
      output: {
        output: items,
        items,
      },
      detail: `variables=${items.length}`,
    };
  }

  return {
    output: {
      output: resolved,
      type: data.output_type || "string",
    },
    detail: `variables=${(data.variables ?? []).length}`,
  };
}
