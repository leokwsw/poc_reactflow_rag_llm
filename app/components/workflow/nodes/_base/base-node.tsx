"use client";

import { Handle, Position } from "reactflow";
import type { ReactNode } from "react";

type NodeTone = "zinc" | "indigo" | "emerald";

type BaseNodeProps = {
  title: string;
  tone?: NodeTone;
  children: ReactNode;
  hasTarget?: boolean;
  hasSource?: boolean;
};

const toneClassMap: Record<NodeTone, { border: string; headerBg: string; title: string; handle: string }> = {
  zinc: {
    border: "border-zinc-200",
    headerBg: "bg-zinc-50",
    title: "text-zinc-900",
    handle: "bg-zinc-600!",
  },
  indigo: {
    border: "border-indigo-200",
    headerBg: "bg-indigo-50",
    title: "text-indigo-900",
    handle: "bg-indigo-600!",
  },
  emerald: {
    border: "border-emerald-200",
    headerBg: "bg-emerald-50",
    title: "text-emerald-900",
    handle: "bg-emerald-600!",
  },
};

export default function BaseNode({
  title,
  tone = "zinc",
  children,
  hasTarget = true,
  hasSource = true,
}: BaseNodeProps) {
  const toneClass = toneClassMap[tone];

  return (
    <div className={`relative min-w-[220px] rounded-xl border bg-white shadow-sm ${toneClass.border}`}>
      <div className={`rounded-t-xl border-b px-3 py-2 ${toneClass.border} ${toneClass.headerBg}`}>
        <p className={`text-sm font-semibold ${toneClass.title}`}>{title}</p>
      </div>

      <div className="space-y-2 p-3">{children}</div>

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
