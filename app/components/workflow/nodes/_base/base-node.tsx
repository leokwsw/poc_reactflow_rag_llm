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
}: BaseNodeProps) {
  const toneClass = toneClassMap[tone];

  return (
    <div className={`relative ${minWidthClassName} overflow-hidden rounded-2xl border bg-white shadow-sm ${toneClass.border}`}>
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
