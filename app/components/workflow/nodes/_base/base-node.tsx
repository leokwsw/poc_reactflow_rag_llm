"use client";

import { Handle, Position } from "reactflow";
import type { ReactNode } from "react";

type NodeTone = "zinc" | "indigo" | "emerald" | "amber";

type BaseNodeProps = {
  title: string;
  subtitle?: string;
  tone?: NodeTone;
  children: ReactNode;
  hasTarget?: boolean;
  hasSource?: boolean;
  minWidthClassName?: string;
  runStatus?: "idle" | "running" | "completed" | "error";
};

const toneClassMap: Record<NodeTone, { border: string; headerBg: string; title: string; handle: string; chip: string }> = {
  zinc: {
    border: "border-zinc-200",
    headerBg: "bg-zinc-50",
    title: "text-zinc-900",
    handle: "bg-zinc-600!",
    chip: "bg-zinc-200 text-zinc-700",
  },
  indigo: {
    border: "border-indigo-200",
    headerBg: "bg-indigo-50",
    title: "text-indigo-900",
    handle: "bg-indigo-600!",
    chip: "bg-indigo-100 text-indigo-700",
  },
  emerald: {
    border: "border-emerald-200",
    headerBg: "bg-emerald-50",
    title: "text-emerald-900",
    handle: "bg-emerald-600!",
    chip: "bg-emerald-100 text-emerald-700",
  },
  amber: {
    border: "border-amber-200",
    headerBg: "bg-amber-50",
    title: "text-amber-900",
    handle: "bg-amber-500!",
    chip: "bg-amber-100 text-amber-700",
  },
};

export default function BaseNode({
  title,
  subtitle,
  tone = "zinc",
  children,
  hasTarget = true,
  hasSource = true,
  minWidthClassName = "min-w-[240px]",
  runStatus = "idle",
}: BaseNodeProps) {
  const toneClass = toneClassMap[tone];
  const runStatusClassName = runStatus === "running"
    ? "ring-2 ring-sky-400 ring-offset-2 ring-offset-sky-50 shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_12px_28px_rgba(56,189,248,0.2)]"
    : runStatus === "error"
      ? "ring-2 ring-red-400 ring-offset-2 ring-offset-red-50 shadow-[0_0_0_1px_rgba(248,113,113,0.25),0_12px_28px_rgba(248,113,113,0.18)]"
      : runStatus === "completed"
        ? "ring-1 ring-emerald-300 ring-offset-1 ring-offset-emerald-50"
        : "";

  return (
    <div className={`relative ${minWidthClassName} overflow-hidden rounded-2xl border bg-white shadow-sm transition ${toneClass.border} ${runStatusClassName}`.trim()}>
      <div className={`border-b px-3 py-2.5 ${toneClass.border} ${toneClass.headerBg}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={`truncate text-sm font-semibold ${toneClass.title}`}>{title}</p>
            {subtitle && <p className="mt-0.5 text-[11px] text-zinc-500">{subtitle}</p>}
          </div>
          <div className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${toneClass.chip}`}>
            {tone}
          </div>
        </div>
      </div>

      <div className="space-y-3 p-3">{children}</div>

      {runStatus !== "idle" && (
        <div className="absolute right-2 top-2.5">
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              runStatus === "running"
                ? "bg-sky-500 shadow-[0_0_0_4px_rgba(56,189,248,0.14)]"
                : runStatus === "error"
                  ? "bg-red-500 shadow-[0_0_0_4px_rgba(248,113,113,0.14)]"
                  : "bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
            }`}
          />
        </div>
      )}

      {hasTarget && (
        <Handle
          type="target"
          position={Position.Left}
          className={`h-3 w-3 border-2! border-white! ${toneClass.handle}`}
        />
      )}
      {hasSource && (
        <Handle
          type="source"
          position={Position.Right}
          className={`h-3 w-3 border-2! border-white! ${toneClass.handle}`}
        />
      )}
    </div>
  );
}
