"use client";

import { useMemo } from "react";
import type { Node, NodeProps } from "reactflow";
import { Handle, Position, useNodes } from "reactflow";

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
    .replace(/^\{\{\s*/, "")
    .replace(/\s*\}\}$/, "")
    .replace(/^#/, "")
    .replace(/#$/g, "");
}

function extractOutputTokens(answer?: string, outputs?: string[]) {
  if (Array.isArray(outputs) && outputs.length > 0) {
    return outputs.map(parseOutputToken).filter(Boolean) as OutputToken[];
  }

  if (!answer) {
    return [];
  }

  const matches = Array.from(answer.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g));
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

  const runStatusClassName = data.runStatus === "running"
    ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-sky-50 shadow-[0_12px_30px_rgba(56,189,248,0.2)]"
    : data.runStatus === "error"
      ? "ring-2 ring-red-400 ring-offset-2 ring-offset-red-50 shadow-[0_12px_30px_rgba(248,113,113,0.16)]"
      : data.runStatus === "completed"
        ? "ring-1 ring-emerald-300 ring-offset-1 ring-offset-emerald-50"
        : "";

  return (
    <div className={`relative w-[260px] overflow-hidden rounded-2xl border border-amber-300 bg-white shadow-[0_10px_30px_rgba(245,158,11,0.12)] ${runStatusClassName}`.trim()}>
      <div className="border-b border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-white px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500 text-[10px] font-bold text-white">
              O
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-amber-700">Answer</p>
              <p className="truncate text-xs font-medium text-zinc-700">{label}</p>
            </div>
          </div>
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
        </div>
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-500">
          <span>變量</span>
          <span>{outputTokens.length}</span>
        </div>

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
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="h-3 w-3 border-2! border-black! bg-amber-500!"
      />
    </div>
  );
}
