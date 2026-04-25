"use client";

import { useMemo } from "react";
import { useNodes } from "reactflow";

export type ParsedWorkflowVariableExpression = {
  source: string;
  field: string;
};

export function parseWorkflowVariableExpression(expression: string): ParsedWorkflowVariableExpression | null {
  const normalized = expression.trim();
  const parts = normalized.split(".").filter(Boolean);
  if (parts.length === 0) {
    return null;
  }

  return {
    source: parts[0],
    field: parts.slice(1).join(".") || "value",
  };
}

export function getWorkflowNodeLabelMap(
  nodes: Array<{ id: string; data?: unknown }>,
) {
  return new Map(
    nodes.map((node) => {
      const nodeData = (node.data ?? {}) as Record<string, unknown>;
      const label = typeof nodeData.label === "string" && nodeData.label.trim()
        ? nodeData.label.trim()
        : node.id;
      return [node.id, label] as const;
    }),
  );
}

export function getWorkflowVariableDisplayLabel(expression: string, labelMap: Map<string, string>) {
  const parsed = parseWorkflowVariableExpression(expression);
  if (!parsed) {
    return expression;
  }

  return `${labelMap.get(parsed.source) || parsed.source}/${parsed.field}`;
}

export function useWorkflowVariableLabelMap() {
  const nodes = useNodes();
  return useMemo(() => getWorkflowNodeLabelMap(nodes), [nodes]);
}

type WorkflowVariableBadgeProps = {
  label: string;
  expression: string;
  className?: string;
};

export function WorkflowVariableBadge({ label, expression, className }: WorkflowVariableBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700 align-middle ${className ?? ""}`.trim()}
      title={`{{#${expression}#}}`}
    >
      {`(${label})`}
    </span>
  );
}
