"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "@/app/components/workflow/nodes/_base/base-node";
import NodeSection from "@/app/components/workflow/nodes/_base/node-section";

type NoteNodeData = {
  text?: string;
  author?: string;
  theme?: "yellow" | "blue" | "green" | "purple";
};

const themeMap: Record<NonNullable<NoteNodeData["theme"]>, { subtitle: string; className: string }> = {
  yellow: { subtitle: "Sticky note", className: "bg-amber-50 border-amber-200 text-amber-900" },
  blue: { subtitle: "Reference note", className: "bg-sky-50 border-sky-200 text-sky-900" },
  green: { subtitle: "Checklist note", className: "bg-emerald-50 border-emerald-200 text-emerald-900" },
  purple: { subtitle: "Idea note", className: "bg-violet-50 border-violet-200 text-violet-900" },
};

export default function NoteNode({ data }: NodeProps<NoteNodeData>) {
  const theme = data.theme ?? "yellow";
  const themeMeta = themeMap[theme];

  return (
    <BaseNode
      title={data.author || "Note"}
      tone="amber"
      hasTarget={false}
      hasSource={false}
      minWidthClassName="min-w-[240px] max-w-[320px]"
    >
      <div className={`rounded-xl border px-3 py-2.5 ${themeMeta.className}`}>
        <NodeSection label="Content">
          <p className="whitespace-pre-wrap text-xs leading-5 text-current">
            {data.text || "Write your workflow note here..."}
          </p>
        </NodeSection>
      </div>
    </BaseNode>
  );
}
