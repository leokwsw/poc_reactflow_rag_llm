"use client";

import {
  getWorkflowVariableDisplayLabel,
  useWorkflowVariableLabelMap,
  WorkflowVariableBadge,
} from "../prompt-editor/workflow-variable-shared";
import { useMemo } from "react";

type ReadonlyTemplateWithVariablesProps = {
  value?: string;
};

export default function ReadonlyTemplateWithVariables({ value }: ReadonlyTemplateWithVariablesProps) {
  const labelMap = useWorkflowVariableLabelMap();

  const content = value?.trim() ?? "";
  const parts = useMemo(() => {
    const tokens: Array<{ type: "text" | "var"; value: string }> = [];
    const matcher = /\{\{#\s*([^}]+?)\s*#\}\}/g;
    let lastIndex = 0;

    for (const match of content.matchAll(matcher)) {
      const fullMatch = match[0] ?? "";
      const expression = (match[1] ?? "").trim();
      const matchIndex = match.index ?? 0;

      if (matchIndex > lastIndex) {
        tokens.push({
          type: "text",
          value: content.slice(lastIndex, matchIndex),
        });
      }

      tokens.push({
        type: "var",
        value: expression,
      });
      lastIndex = matchIndex + fullMatch.length;
    }

    if (lastIndex < content.length) {
      tokens.push({
        type: "text",
        value: content.slice(lastIndex),
      });
    }

    return tokens;
  }, [content]);

  if (!content) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-400">
        No answer template
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 px-2.5 py-2 text-xs leading-5 text-zinc-700">
      {parts.map((part, index) => {
        if (part.type === "text") {
          return (
            <span key={`${part.type}-${index}`} className="whitespace-pre-wrap break-words">
              {part.value}
            </span>
          );
        }

        const label = getWorkflowVariableDisplayLabel(part.value, labelMap);

        return (
          <WorkflowVariableBadge
            key={`${part.type}-${index}`}
            expression={part.value}
            label={label}
            className="mx-0.5 text-[11px]"
          />
        );
      })}
    </div>
  );
}
