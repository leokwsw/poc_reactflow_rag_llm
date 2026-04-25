"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";
import NodeToken from "@/app/components/workflow/nodes/_base/node-token";

type TriggerScheduleNodeData = {
  label?: string;
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

export default function TriggerScheduleNode({ data }: NodeProps<TriggerScheduleNodeData>) {
  const mode = data.mode ?? "visual";
  const visualConfig = data.visual_config;
  const description = mode === "cron"
    ? (data.cron_expression || "0 0 * * *")
    : `${data.frequency || "daily"}${visualConfig?.time ? ` at ${visualConfig.time}` : ""}`;

  return (
    <BaseNode title={data.label || "Trigger Schedule"} tone="zinc" hasTarget={false} hasSource>
      <NodeSection label="Schedule">
        <NodeToken>{description}</NodeToken>
      </NodeSection>
      <NodeSection label="Timezone">
        <NodeToken>{data.timezone || "UTC"}</NodeToken>
      </NodeSection>
    </BaseNode>
  );
}
