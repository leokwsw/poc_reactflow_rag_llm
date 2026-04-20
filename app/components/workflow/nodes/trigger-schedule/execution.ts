import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";

type TriggerScheduleNodeData = {
  mode?: string;
  frequency?: string;
  timezone?: string;
  cron_expression?: string;
  visual_config?: {
    time?: string;
    on_minute?: number;
    weekdays?: string[];
    monthly_days?: Array<number | "last">;
  };
};

export async function executeTriggerScheduleNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as TriggerScheduleNodeData;

  return {
    output: {
      trigger: "schedule",
      mode: data.mode || "visual",
      frequency: data.frequency || "daily",
      timezone: data.timezone || "UTC",
      cron_expression: data.cron_expression || "0 0 * * *",
      visual_config: data.visual_config ?? null,
      query: context.input.query,
      files: context.input.files,
    },
    detail: `trigger=schedule, mode=${data.mode || "visual"}`,
  };
}
