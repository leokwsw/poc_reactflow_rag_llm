"use client";

import { PanelButton, PanelCard, PanelField, PanelInput } from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";

type IfElseCase = {
  id: string;
  label: string;
  conditions?: string[];
};

type IfElseNodeData = {
  label?: string;
  cases?: IfElseCase[];
};

export default function IfElsePanel({ node, patchNodeData }: NodePanelProps) {
  const data = (node.data ?? {}) as IfElseNodeData;
  const cases = data.cases ?? [];

  return (
    <div className="space-y-4">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "If / Else"} onChange={(event) => patchNodeData({ label: event.target.value })} />
      </PanelField>

      <div className="space-y-3">
        {cases.map((caseItem, index) => (
          <PanelCard key={caseItem.id}>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-zinc-700">{index === 0 ? "IF Case" : `ELSE IF ${index}`}</p>
              <PanelButton
                className="w-auto border-0 p-0"
                danger
                onClick={() => patchNodeData({ cases: cases.filter((item) => item.id !== caseItem.id) })}
              >
                Remove
              </PanelButton>
            </div>
            <PanelField label="Branch Label">
              <PanelInput
                value={caseItem.label}
                onChange={(event) =>
                  patchNodeData({
                    cases: cases.map((item) => (item.id === caseItem.id ? { ...item, label: event.target.value } : item)),
                  })
                }
              />
            </PanelField>
            <PanelField label="Condition">
              <PanelInput
                placeholder="query contains 'help'"
                value={caseItem.conditions?.[0] ?? ""}
                onChange={(event) =>
                  patchNodeData({
                    cases: cases.map((item) => (item.id === caseItem.id ? { ...item, conditions: [event.target.value] } : item)),
                  })
                }
              />
            </PanelField>
          </PanelCard>
        ))}
      </div>

      <PanelButton
        onClick={() =>
          patchNodeData({
            cases: [
              ...cases,
              {
                id: `elif-${Date.now()}`,
                label: `ELSE IF ${cases.length}`,
                conditions: [""],
              },
            ],
          })
        }
      >
        Add Else If Case
      </PanelButton>
    </div>
  );
}
