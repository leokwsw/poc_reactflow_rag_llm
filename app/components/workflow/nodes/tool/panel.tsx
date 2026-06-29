"use client";

import {useEffect, useMemo, useState} from "react";
import {PanelButton, PanelCard, PanelField, PanelInput} from "@/app/components/workflow/nodes/_base/panel-form";
import type {NodePanelProps} from "@/app/components/workflow/nodes/panel-types";
import type {ToolRecord} from "@/app/tools/data";

type InputMappingRow = {
  id?: string;
  enabled?: boolean;
  name?: string;
  value?: string;
};

type ToolNodeData = {
  label?: string;
  tool_id?: string;
  input_mapping?: InputMappingRow[];
};

const createRow = (): InputMappingRow => ({
  id: crypto.randomUUID(),
  enabled: true,
  name: "",
  value: "",
});

function MappingTable({
  rows,
  onChange,
}: {
  rows: InputMappingRow[];
  onChange: (rows: InputMappingRow[]) => void;
}) {
  const updateRow = (index: number, patch: Partial<InputMappingRow>) => {
    const next = [...rows];
    next[index] = {...next[index], ...patch};
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={row.id || index} className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
          <input
            aria-label="Enabled"
            checked={row.enabled ?? true}
            className="mt-2"
            type="checkbox"
            onChange={(event) => updateRow(index, {enabled: event.target.checked})}
          />
          <PanelInput
            placeholder="arg name"
            value={row.name ?? ""}
            onChange={(event) => updateRow(index, {name: event.target.value})}
          />
          <PanelInput
            placeholder="{{#sys.query#}}"
            value={row.value ?? ""}
            onChange={(event) => updateRow(index, {value: event.target.value})}
          />
          <button
            className="rounded-xl border border-zinc-200 px-2 text-xs font-medium text-zinc-500 transition hover:bg-white"
            type="button"
            onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}
          >
            Remove
          </button>
        </div>
      ))}
      <PanelButton onClick={() => onChange([...rows, createRow()])}>Add Input</PanelButton>
    </div>
  );
}

export default function ToolPanel({node, patchNodeData}: NodePanelProps) {
  const data = (node.data ?? {}) as ToolNodeData;
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [loadError, setLoadError] = useState("");
  const mapping = data.input_mapping ?? [];
  const selectedTool = useMemo(() => tools.find((tool) => tool.id === data.tool_id), [data.tool_id, tools]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/tools");
        const payload = (await response.json()) as {tools?: ToolRecord[]; error?: string};
        if (!response.ok) throw new Error(payload.error ?? `Failed to load tools (${response.status}).`);
        if (!cancelled) {
          setTools(payload.tools ?? []);
          setLoadError("");
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Could not load tools.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <PanelCard>
        <PanelField label="Label">
          <PanelInput value={data.label ?? "Tool"} onChange={(event) => patchNodeData({label: event.target.value})} />
        </PanelField>
        <PanelField label="Tool">
          <select
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            value={data.tool_id ?? ""}
            onChange={(event) => {
              const tool = tools.find((item) => item.id === event.target.value);
              patchNodeData({
                tool_id: event.target.value,
                label: tool?.name ?? data.label ?? "Tool",
              });
            }}
          >
            <option value="">Select a tool...</option>
            {tools.map((tool) => (
              <option key={tool.id} value={tool.id} disabled={!tool.enabled}>
                {tool.name}{tool.enabled ? "" : " (disabled)"}
              </option>
            ))}
          </select>
        </PanelField>
        {loadError ? <p className="text-sm text-red-600">{loadError}</p> : null}
        {selectedTool ? (
          <p className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs leading-5 text-zinc-500">
            {selectedTool.method} {selectedTool.url}
          </p>
        ) : null}
      </PanelCard>

      <PanelCard>
        <div>
          <p className="text-sm font-semibold text-zinc-800">Input Mapping</p>
          <p className="mt-1 text-xs text-zinc-500">
            Values become available to the tool as <code>{"{{#arg.name#}}"}</code>.
          </p>
        </div>
        <MappingTable rows={mapping} onChange={(rows) => patchNodeData({input_mapping: rows})} />
      </PanelCard>
    </div>
  );
}

