"use client";

import {PanelButton, PanelCard, PanelField, PanelInput} from "@/app/components/workflow/nodes/_base/panel-form";
import type {NodePanelProps} from "@/app/components/workflow/nodes/panel-types";
import {getContextOptions} from "@/app/components/workflow/nodes/prompt-variable-options";

type LogicalOperator = "and" | "or";
type ComparisonOperator = "includes" | "not_includes" | "starts_with" | "ends_with" | "is" | "is_not" | "is_empty" | "is_not_empty";

type IfElseCondition = {
  id: string;
  left?: string;
  operator?: ComparisonOperator;
  right?: string;
};

type IfElseCase = {
  id: string;
  label: string;
  logical_operator?: LogicalOperator;
  conditions?: Array<IfElseCondition | string>;
};

type IfElseNodeData = {
  label?: string;
  cases?: IfElseCase[];
};

const COMPARISON_OPTIONS: Array<{value: ComparisonOperator; label: string}> = [
  {value: "includes", label: "including"},
  {value: "not_includes", label: "not including"},
  {value: "starts_with", label: "starts with"},
  {value: "ends_with", label: "ends with"},
  {value: "is", label: "is"},
  {value: "is_not", label: "is not"},
  {value: "is_empty", label: "is empty"},
  {value: "is_not_empty", label: "is not empty"},
];

const createCondition = (left = "query"): IfElseCondition => ({
  id: crypto.randomUUID(),
  left,
  operator: "includes",
  right: "",
});

const createCase = (index: number): IfElseCase => ({
  id: index === 0 ? "if" : `elif-${crypto.randomUUID()}`,
  label: index === 0 ? "IF" : `ELSE IF ${index}`,
  logical_operator: "and",
  conditions: [createCondition()],
});

function normalizeCondition(condition: IfElseCondition | string): IfElseCondition {
  if (typeof condition === "string") {
    return {
      ...createCondition(),
      left: condition,
      operator: "is_not_empty",
      right: "",
    };
  }

  return {
    id: condition.id || crypto.randomUUID(),
    left: condition.left ?? "query",
    operator: condition.operator ?? "includes",
    right: condition.right ?? "",
  };
}

function normalizeCases(cases?: IfElseCase[]) {
  const safeCases = cases && cases.length > 0 ? cases : [createCase(0)];
  return safeCases.map((caseItem, index) => ({
    id: index === 0 ? (caseItem.id || "if") : (caseItem.id || `elif-${index}`),
    label: caseItem.label || (index === 0 ? "IF" : `ELSE IF ${index}`),
    logical_operator: caseItem.logical_operator ?? "and",
    conditions: (caseItem.conditions && caseItem.conditions.length > 0 ? caseItem.conditions : [createCondition()]).map(normalizeCondition),
  }));
}

export default function IfElsePanel({node, patchNodeData, allNodes, allEdges}: NodePanelProps) {
  const data = (node.data ?? {}) as IfElseNodeData;
  const cases = normalizeCases(data.cases);
  const parentValueOptions = getContextOptions(allNodes, allEdges, node.id);
  const defaultLeftValue = parentValueOptions[0]?.value ?? "";

  function patchCase(caseId: string, patch: Partial<IfElseCase>) {
    patchNodeData({
      cases: cases.map((item) => (item.id === caseId ? {...item, ...patch} : item)),
    });
  }

  function patchCondition(caseId: string, conditionId: string, patch: Partial<IfElseCondition>) {
    patchNodeData({
      cases: cases.map((caseItem) => {
        if (caseItem.id !== caseId) {
          return caseItem;
        }

        return {
          ...caseItem,
          conditions: (caseItem.conditions ?? []).map((condition) => {
            const normalized = normalizeCondition(condition);
            return normalized.id === conditionId ? {...normalized, ...patch} : normalized;
          }),
        };
      }),
    });
  }

  function removeCondition(caseId: string, conditionId: string) {
    patchNodeData({
      cases: cases.map((caseItem) => {
        if (caseItem.id !== caseId) {
          return caseItem;
        }

        const nextConditions = (caseItem.conditions ?? [])
          .map(normalizeCondition)
          .filter((condition) => condition.id !== conditionId);
        return {
          ...caseItem,
          conditions: nextConditions.length > 0 ? nextConditions : [createCondition()],
        };
      }),
    });
  }

  return (
    <div className="space-y-4">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "If / Else"} onChange={(event) => patchNodeData({label: event.target.value})} />
      </PanelField>

      <div className="space-y-3">
        {cases.map((caseItem, index) => {
          const conditions = (caseItem.conditions ?? []).map(normalizeCondition);
          const isFirst = index === 0;

          return (
            <PanelCard key={caseItem.id}>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold text-zinc-700">{isFirst ? "IF" : `ELSE IF ${index}`}</p>
                {!isFirst ? (
                  <PanelButton
                    className="w-auto border-0 p-0"
                    danger
                    onClick={() => patchNodeData({cases: cases.filter((item) => item.id !== caseItem.id)})}
                  >
                    Remove
                  </PanelButton>
                ) : null}
              </div>

              <PanelField label="Branch Label">
                <PanelInput
                  value={caseItem.label}
                  onChange={(event) => patchCase(caseItem.id, {label: event.target.value})}
                />
              </PanelField>

              <PanelField label="Condition Match">
                <select
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  value={caseItem.logical_operator ?? "and"}
                  onChange={(event) => patchCase(caseItem.id, {logical_operator: event.target.value as LogicalOperator})}
                >
                  <option value="and">AND - all conditions</option>
                  <option value="or">OR - any condition</option>
                </select>
              </PanelField>

              <div className="space-y-2">
                {conditions.map((condition) => {
                  const operator = condition.operator ?? "includes";
                  const valueDisabled = operator === "is_empty" || operator === "is_not_empty";
                  const selectedLeft = condition.left ?? "";
                  const hasSelectedLeft = parentValueOptions.some((option) => option.value === selectedLeft);

                  return (
                    <div key={condition.id} className="rounded-xl border border-zinc-200 bg-white p-2">
                      <div className="grid grid-cols-[minmax(0,1fr)_160px_minmax(0,1fr)_auto] gap-2">
                        <select
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
                          disabled={parentValueOptions.length === 0}
                          value={selectedLeft}
                          onChange={(event) => patchCondition(caseItem.id, condition.id, {left: event.target.value})}
                        >
                          {parentValueOptions.length === 0 ? (
                            <option value="">No parent value available</option>
                          ) : null}
                          {!hasSelectedLeft && selectedLeft ? (
                            <option value={selectedLeft}>{selectedLeft}</option>
                          ) : null}
                          {parentValueOptions.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        <select
                          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                          value={operator}
                          onChange={(event) => patchCondition(caseItem.id, condition.id, {operator: event.target.value as ComparisonOperator})}
                        >
                          {COMPARISON_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                        <PanelInput
                          disabled={valueDisabled}
                          placeholder={valueDisabled ? "No value needed" : "Compare value"}
                          value={condition.right ?? ""}
                          onChange={(event) => patchCondition(caseItem.id, condition.id, {right: event.target.value})}
                        />
                        <button
                          className="rounded-xl border border-zinc-200 px-2 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50"
                          type="button"
                          onClick={() => removeCondition(caseItem.id, condition.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <PanelButton
                onClick={() => patchCase(caseItem.id, {conditions: [...conditions, createCondition(defaultLeftValue)]})}
              >
                Add Condition
              </PanelButton>
            </PanelCard>
          );
        })}

        <PanelCard>
          <p className="text-xs font-semibold text-zinc-700">ELSE</p>
          <p className="text-xs leading-5 text-zinc-500">Fallback branch when no IF or ELSE IF conditions match.</p>
        </PanelCard>
      </div>

      <PanelButton
        onClick={() =>
          patchNodeData({
            cases: [
              ...cases,
              {
                ...createCase(cases.length),
                conditions: [createCondition(defaultLeftValue)],
              },
            ],
          })
        }
      >
        Add Else If
      </PanelButton>
    </div>
  );
}
