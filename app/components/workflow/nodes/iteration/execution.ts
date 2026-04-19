import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import { getInputValue } from "@/app/components/workflow/nodes/_base/execution-helpers";

type IterationNodeData = {
  iterator?: string;
  itemName?: string;
};

export async function executeIterationNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as IterationNodeData;
  const sourceValue = getInputValue(context, data.iterator);
  const items = Array.isArray(sourceValue) ? sourceValue : [];

  return {
    output: {
      items,
      item_name: data.itemName || "item",
      count: items.length,
    },
    detail: `items=${items.length}`,
  };
}

