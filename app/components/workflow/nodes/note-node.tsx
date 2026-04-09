"use client";

import type { NodeProps } from "reactflow";

type NoteNodeData = {
  text?: string;
  author?: string;
  theme?: "yellow" | "blue" | "green" | "purple";
};

const themeMap: Record<NonNullable<NoteNodeData["theme"]>, string> = {
  yellow: "bg-amber-100 border-amber-200",
  blue: "bg-sky-100 border-sky-200",
  green: "bg-emerald-100 border-emerald-200",
  purple: "bg-violet-100 border-violet-200",
};

export default function NoteNode({ data, selected }: NodeProps<NoteNodeData>) {
  const theme = data.theme ?? "yellow";
  const themeClass = themeMap[theme];

  return (
    <div
      className={`min-h-[96px] min-w-[240px] max-w-[320px] rounded-md border p-3 shadow-sm ${themeClass} ${
        selected ? "ring-2 ring-zinc-300" : ""
      }`}
    >
      <p className="whitespace-pre-wrap text-sm text-zinc-800">
        {data.text || "Write your workflow note here..."}
      </p>
      {data.author && <p className="mt-3 text-xs text-zinc-600">{data.author}</p>}
    </div>
  );
}
