"use client";

import { useMemo } from "react";
import { useNodes } from "reactflow";

type ReadonlyTemplateWithVariablesProps = {
  value?: string;
};

function getNodeDisplayLabel(nodeId: string, labelMap: Map<string, string>) {
  return labelMap.get(nodeId) || nodeId;
}

function parseExpression(expression: string) {
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

export default function ReadonlyTemplateWithVariables({ value }: ReadonlyTemplateWithVariablesProps) {
  const nodes = useNodes();
  const labelMap = useMemo(() => {
    return new Map(
      nodes.map((node) => {
        const nodeData = (node.data ?? {}) as Record<string, unknown>;
        const label = typeof nodeData.label === "string" && nodeData.label.trim()
          ? nodeData.label.trim()
          : node.id;
        return [node.id, label] as const;
      }),
    );
  }, [nodes]);

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

        const parsed = parseExpression(part.value);
        const label = parsed
          ? `${getNodeDisplayLabel(parsed.source, labelMap)}/${parsed.field}`
          : part.value;

        return (
          <span
            key={`${part.type}-${index}`}
            className="mx-0.5 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 align-middle"
            title={`{{#${part.value}#}}`}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}
