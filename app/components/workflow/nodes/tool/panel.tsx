"use client";

import {useEffect, useMemo, useState} from "react";
import {PanelCard, PanelField, PanelInput} from "@/app/components/workflow/nodes/_base/panel-form";
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

type SchemaField = {
  name: string;
  required: boolean;
  type?: string;
  description?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const schemaFieldsForTool = (tool: ToolRecord | undefined): SchemaField[] => {
  if (!tool) return [];
  const properties = isRecord(tool.input_schema?.properties) ? tool.input_schema.properties : {};
  const required = Array.isArray(tool.input_schema?.required)
    ? new Set(tool.input_schema.required.filter((item): item is string => typeof item === "string"))
    : new Set<string>();

  return Object.entries(properties).map(([name, schema]) => ({
    name,
    required: required.has(name),
    type: isRecord(schema) && typeof schema.type === "string" ? schema.type : undefined,
    description: isRecord(schema) && typeof schema.description === "string" ? schema.description : undefined,
  }));
};

const defaultMappingValue = (name: string) =>
  ["query", "question", "q", "text", "input"].includes(name.toLowerCase()) ? "{{#sys.query#}}" : "";

const mappingFromSchema = (fields: SchemaField[], currentRows: InputMappingRow[]) =>
  fields.map((field) => {
    const current = currentRows.find((row) => row.name === field.name);
    return {
      id: current?.id ?? `input-${field.name}`,
      enabled: true,
      name: field.name,
      value: current?.value ?? defaultMappingValue(field.name),
    };
  });

function MappingTable({
  rows,
  fields,
  onChange,
}: {
  rows: InputMappingRow[];
  fields: SchemaField[];
  onChange: (rows: InputMappingRow[]) => void;
}) {
  const updateValue = (index: number, value: string) => {
    const next = [...rows];
    next[index] = {...next[index], enabled: true, name: fields[index]?.name ?? next[index].name, value};
    onChange(next);
  };

  if (fields.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-200 bg-white px-3 py-4 text-center text-xs text-zinc-500">
        This OpenAPI operation has no input parameters.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {fields.map((field, index) => (
        <div key={field.name} className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-2">
          <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-medium text-zinc-800">{field.name}</span>
              {field.required ? <span className="text-[10px] font-semibold uppercase text-red-500">Required</span> : null}
            </div>
            <p className="mt-1 truncate text-[11px] text-zinc-500">{field.type ?? "value"}{field.description ? ` · ${field.description}` : ""}</p>
          </div>
          <PanelInput
            placeholder="{{#sys.query#}}"
            value={rows[index]?.value ?? defaultMappingValue(field.name)}
            onChange={(event) => updateValue(index, event.target.value)}
          />
        </div>
      ))}
    </div>
  );
}

export default function ToolPanel({node, patchNodeData}: NodePanelProps) {
  const data = (node.data ?? {}) as ToolNodeData;
  const [tools, setTools] = useState<ToolRecord[]>([]);
  const [loadError, setLoadError] = useState("");
  const mapping = useMemo(() => data.input_mapping ?? [], [data.input_mapping]);
  const selectedTool = useMemo(() => tools.find((tool) => tool.id === data.tool_id), [data.tool_id, tools]);
  const schemaFields = useMemo(() => schemaFieldsForTool(selectedTool), [selectedTool]);

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

  useEffect(() => {
    if (!selectedTool) return;
    const nextMapping = mappingFromSchema(schemaFields, mapping);
    const currentNames = mapping.map((row) => row.name ?? "").join("\u0000");
    const nextNames = nextMapping.map((row) => row.name ?? "").join("\u0000");
    if (currentNames !== nextNames || mapping.length !== nextMapping.length) {
      patchNodeData({input_mapping: nextMapping});
    }
  }, [mapping, patchNodeData, schemaFields, selectedTool]);

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
              const fields = schemaFieldsForTool(tool);
              patchNodeData({
                tool_id: event.target.value,
                label: tool?.name ?? data.label ?? "Tool",
                input_mapping: mappingFromSchema(fields, data.input_mapping ?? []),
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
            Inputs are generated from the selected OpenAPI operation. Names cannot be added or removed.
          </p>
        </div>
        <MappingTable
          fields={schemaFields}
          rows={mappingFromSchema(schemaFields, mapping)}
          onChange={(rows) => patchNodeData({input_mapping: rows})}
        />
      </PanelCard>
    </div>
  );
}
