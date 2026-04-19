import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import { getPrimaryParentOutput, toRecord } from "@/app/components/workflow/nodes/_base/execution-helpers";

export async function executeIterationStartNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  return {
    output: toRecord(getPrimaryParentOutput(context), "iteration"),
    detail: "iteration-start",
  };
}

