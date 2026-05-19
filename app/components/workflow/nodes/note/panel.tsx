"use client";

import {PanelCard, PanelField, PanelInput} from "@/app/components/workflow/nodes/_base/panel-form";
import type {NodePanelProps} from "@/app/components/workflow/nodes/panel-types";

type NoteNodeData = {
  label?: string;
  content?: string;
  author?: string;
};

export default function NotePanel({node, patchNodeData}: NodePanelProps) {
  const data = (node.data ?? {}) as NoteNodeData;

  return (
    <div className="space-y-4">
      <PanelCard>
        <PanelField label="Label">
          <PanelInput value={data.label ?? "Note"} onChange={(event) => patchNodeData({label: event.target.value})} />
        </PanelField>
        <PanelField label="Author">
          <PanelInput value={data.author ?? ""} onChange={(event) => patchNodeData({author: event.target.value})} />
        </PanelField>
        <PanelField label="Content">
          <textarea
            className="min-h-32 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            value={data.content ?? ""}
            onChange={(event) => patchNodeData({content: event.target.value})}
          />
        </PanelField>
      </PanelCard>
    </div>
  );
}
