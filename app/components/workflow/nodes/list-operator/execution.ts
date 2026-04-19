import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import { getInputValue } from "@/app/components/workflow/nodes/_base/execution-helpers";

type ListOperatorNodeData = {
  operation?: string;
  targetList?: string;
};

export async function executeListOperatorNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as ListOperatorNodeData;
  const source = getInputValue(context, data.targetList);
  const list = Array.isArray(source) ? source : [];
  const operation = data.operation || "map";

  let result: unknown[] = list;
  if (operation === "unique")
    result = Array.from(new Set(list.map((item) => JSON.stringify(item)))).map((item) => JSON.parse(item));
  if (operation === "reverse")
    result = [...list].reverse();
  if (operation === "slice")
    result = list.slice(0, 3);

  return {
    output: {
      result,
      count: result.length,
    },
    detail: `${operation}(${list.length})`,
  };
}

