"use client";

import { useMemo } from "react";
import type { Node, NodeProps } from "reactflow";
import { useNodes } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";

type EndNodeData = {
  label?: string;
  outputs?: string[];
  answer?: string;
  runStatus?: "idle" | "running" | "completed" | "error";
};

type OutputToken = {
  raw: string;
  source: string;
  field: string;
};

function normalizeExpression(expression: string) {
  return expression
    .trim()
    .replace(/^\{\{#\s*/, "")
    .replace(/\s*#\}\}$/, "");
}

function extractOutputTokens(answer?: string, outputs?: string[]) {
  if (Array.isArray(outputs) && outputs.length > 0) {
    return outputs.map(parseOutputToken).filter(Boolean) as OutputToken[];
  }

  if (!answer) {
    return [];
  }

  const matches = Array.from(answer.matchAll(/\{\{#\s*([^}]+?)\s*#\}\}/g));
  return matches
    .map((match) => parseOutputToken(match[1] ?? ""))
    .filter(Boolean) as OutputToken[];
}

function parseOutputToken(expression: string): OutputToken | null {
  const normalized = normalizeExpression(expression);
  if (!normalized) {
    return null;
  }

  const parts = normalized.split(".").filter(Boolean);
  if (parts.length === 0) {
    return null;
  }

  return {
    raw: normalized,
    source: parts[0],
    field: parts.slice(1).join(".") || "output",
  };
}

function formatSourceLabel(source: string) {
  return source
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getNodeDisplayLabel(node?: Node) {
  const label = node?.data?.label;
  if (typeof label === "string" && label.trim()) {
    return label.trim();
  }

  const title = node?.data?.title;
  if (typeof title === "string" && title.trim()) {
    return title.trim();
  }

  return node?.id ?? "";
}

export default function EndNode({ data }: NodeProps<EndNodeData>) {
  const label = data.label?.trim() || "Answer";
  const outputTokens = extractOutputTokens(data.answer, data.outputs);
  const nodes = useNodes();
  const nodeLabelMap = useMemo(() => {
    return new Map(nodes.map((node) => [node.id, getNodeDisplayLabel(node)]));
  }, [nodes]);
  const visibleTokens = outputTokens.slice(0, 18);
  const hiddenCount = Math.max(0, outputTokens.length - visibleTokens.length);

  return (
    <BaseNode
      title={label}
      tone="amber"
      hasTarget
      hasSource={false}
      minWidthClassName="w-[260px]"
      runStatus={data.runStatus}
    >
      <NodeSection label="Variables">
        <div className="max-h-[360px] space-y-1.5 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-50/80 p-2">
          {visibleTokens.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-2.5 py-2 text-xs text-zinc-400">
              No output variables
            </div>
          ) : (
            visibleTokens.map((token, index) => (
              <div
                key={`${token.raw}-${index}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-[11px] shadow-sm"
              >
                <span className="min-w-0 truncate font-medium text-zinc-700">
                  {nodeLabelMap.get(token.source) || formatSourceLabel(token.source)}
                </span>
                <span className="shrink-0 rounded-md bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] text-indigo-600">
                  {"{"}{token.field}{"}"}
                </span>
              </div>
            ))
          )}

          {hiddenCount > 0 && (
            <div className="rounded-lg border border-dashed border-zinc-200 bg-white px-2.5 py-1.5 text-center text-[11px] text-zinc-500">
              + {hiddenCount} more outputs
            </div>
          )}
        </div>
      </NodeSection>
    </BaseNode>
  );
}
