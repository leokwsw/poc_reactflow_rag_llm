import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import { getPrimaryParentOutput, toRecord } from "@/app/components/workflow/nodes/_base/execution-helpers";

export async function executeLoopStartNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  return {
    output: toRecord(getPrimaryParentOutput(context), "loop"),
    detail: "loop-start",
  };
}

