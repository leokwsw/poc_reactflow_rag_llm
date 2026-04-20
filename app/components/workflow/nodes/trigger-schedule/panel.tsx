"use client";

import { PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

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

export default function TriggerSchedulePanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as TriggerScheduleNodeData;
  const visualConfig = data.visual_config ?? {
    time: "12:00 AM",
    on_minute: 0,
    weekdays: ["sun"],
    monthly_days: [1],
  };

  return (
    <div className="space-y-3">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Trigger Schedule"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Mode">
        <PanelInput value={data.mode ?? "visual"} onChange={(event) => patchNodeData({ mode: event.target.value })} />
      </PanelField>
      <PanelField label="Frequency">
        <PanelInput value={data.frequency ?? "daily"} onChange={(event) => patchNodeData({ frequency: event.target.value })} />
      </PanelField>
      <PanelField label="Timezone">
        <PanelInput value={data.timezone ?? "UTC"} onChange={(event) => patchNodeData({ timezone: event.target.value })} />
      </PanelField>
      <PanelField label="Cron Expression">
        <PanelInput value={data.cron_expression ?? "0 0 * * *"} onChange={(event) => patchNodeData({ cron_expression: event.target.value })} />
      </PanelField>
      <PanelField label="Visual Time">
        <PanelInput value={visualConfig.time ?? "12:00 AM"} onChange={(event) => patchNodeData({ visual_config: { ...visualConfig, time: event.target.value } })} />
      </PanelField>
      <PanelField label="On Minute">
        <PanelInput value={String(visualConfig.on_minute ?? 0)} onChange={(event) => patchNodeData({ visual_config: { ...visualConfig, on_minute: Number(event.target.value) || 0 } })} />
      </PanelField>
      <PanelField label="Weekdays">
        <PanelInput
          value={(visualConfig.weekdays ?? []).join(", ")}
          onChange={(event) => patchNodeData({ visual_config: { ...visualConfig, weekdays: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) } })}
        />
      </PanelField>
      <PanelField label="Monthly Days">
        <PanelInput
          value={(visualConfig.monthly_days ?? []).join(", ")}
          onChange={(event) => patchNodeData({ visual_config: { ...visualConfig, monthly_days: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) } })}
        />
      </PanelField>
    </div>
  );
}
