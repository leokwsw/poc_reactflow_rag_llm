"use client";

import { PanelButton, PanelCard, PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type VariableAggregatorItem = {
  expression: string;
};

type VariableAggregatorNodeData = {
  label?: string;
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

export default function VariableAggregatorPanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as VariableAggregatorNodeData;
  const variables = data.variables ?? [];
  const advancedSettings = data.advanced_settings ?? { group_enabled: false, groups: [] };
  const groups = advancedSettings.groups ?? [];

  return (
    <div className="space-y-4">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Variable Aggregator"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>
      <PanelField label="Output Type">
        <PanelInput value={data.output_type ?? "string"} onChange={(event) => patchNodeData({ output_type: event.target.value })} />
      </PanelField>
      <PanelField label="Group Mode">
        <PanelInput
          value={String(advancedSettings.group_enabled ?? false)}
          onChange={(event) => patchNodeData({ advanced_settings: { ...advancedSettings, group_enabled: event.target.value === "true" } })}
        />
      </PanelField>
      {advancedSettings.group_enabled ? (
        <>
          <div className="space-y-3">
            {groups.map((group, index) => (
              <PanelCard key={`${group.group_name}-${index}`}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-700">Group {index + 1}</p>
                  <PanelButton className="w-auto border-0 p-0" danger onClick={() => patchNodeData({ advanced_settings: { ...advancedSettings, groups: groups.filter((_, itemIndex) => itemIndex !== index) } })}>
                    Remove
                  </PanelButton>
                </div>
                <PanelField label="Group Name">
                  <PanelInput
                    value={group.group_name ?? ""}
                    onChange={(event) => patchNodeData({ advanced_settings: { ...advancedSettings, groups: groups.map((item, itemIndex) => itemIndex === index ? { ...item, group_name: event.target.value } : item) } })}
                  />
                </PanelField>
                <PanelField label="Variables">
                  <PanelInput
                    value={(group.variables ?? []).map((item) => item.join(".")).join(", ")}
                    onChange={(event) => patchNodeData({
                      advanced_settings: {
                        ...advancedSettings,
                        groups: groups.map((item, itemIndex) => itemIndex === index
                          ? { ...item, variables: event.target.value.split(",").map((selector) => selector.trim()).filter(Boolean).map((selector) => selector.split(".").map((part) => part.trim()).filter(Boolean)) }
                          : item,
                        ),
                      },
                    })}
                  />
                </PanelField>
              </PanelCard>
            ))}
          </div>
          <PanelButton onClick={() => patchNodeData({ advanced_settings: { ...advancedSettings, groups: [...groups, { group_name: `group_${groups.length + 1}`, variables: [["start", "query"]] }] } })}>
            Add Group
          </PanelButton>
        </>
      ) : (
        <>
          <div className="space-y-3">
            {variables.map((item, index) => {
              const expression = Array.isArray(item) ? item.join(".") : item.expression;
              return (
                <PanelCard key={`${expression}-${index}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-zinc-700">Variable {index + 1}</p>
                    <PanelButton className="w-auto border-0 p-0" danger onClick={() => patchNodeData({ variables: variables.filter((_, itemIndex) => itemIndex !== index) })}>
                      Remove
                    </PanelButton>
                  </div>
                  <PanelField label="Selector">
                    <PanelInput
                      value={expression}
                      onChange={(event) => patchNodeData({ variables: variables.map((variable, itemIndex) => itemIndex === index ? event.target.value.split(".").map((part) => part.trim()).filter(Boolean) : variable) })}
                    />
                  </PanelField>
                </PanelCard>
              );
            })}
          </div>
          <PanelButton onClick={() => patchNodeData({ variables: [...variables, ["start", "query"]] })}>
            Add Variable
          </PanelButton>
        </>
      )}
    </div>
  );
}
