import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import { interpolateTemplate } from "@/app/components/workflow/nodes/_base/execution-helpers";

type Assignment = {
  target: string;
  value: string;
};

type AssignerNodeData = {
  assignments?: Assignment[];
};

export async function executeAssignerNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as AssignerNodeData;
  const assignments = data.assignments ?? [];
  const output: Record<string, unknown> = {};

  assignments.forEach((item) => {
    output[item.target] = interpolateTemplate(item.value, context);
  });

  return {
    output,
    detail: `assignments=${assignments.length}`,
  };
}

