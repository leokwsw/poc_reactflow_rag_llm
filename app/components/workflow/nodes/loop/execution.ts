import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import { getPrimaryParentOutput, toRecord } from "@/app/components/workflow/nodes/_base/execution-helpers";

export async function executeLoopNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  return {
    output: {
      ...toRecord(getPrimaryParentOutput(context), "loop_input"),
      loop_supported: false,
    },
    detail: "loop-placeholder",
  };
}

