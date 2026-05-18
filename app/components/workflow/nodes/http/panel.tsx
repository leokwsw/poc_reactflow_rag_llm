"use client";

import {PanelButton, PanelCard, PanelField, PanelInput} from "@/app/components/workflow/nodes/_base/panel-form";
import type {NodePanelProps} from "@/app/components/workflow/nodes/panel-types";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS";
type HttpBodyType = "none" | "form-data" | "x-www-form-urlencoded" | "json" | "raw" | "binary";

type HttpKeyValueRow = {
  id: string;
  enabled?: boolean;
  name?: string;
  value?: string;
};

type HttpNodeData = {
  label?: string;
  method?: HttpMethod;
  url?: string;
  headers?: HttpKeyValueRow[];
  params?: HttpKeyValueRow[];
  body_type?: HttpBodyType;
  body_form_data?: HttpKeyValueRow[];
  body_urlencoded?: HttpKeyValueRow[];
  body_json?: string;
  body_raw?: string;
  body_binary?: string;
  skip_ssl_verification?: boolean;
};

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const BODY_TYPES: Array<{value: HttpBodyType; label: string}> = [
  {value: "none", label: "none"},
  {value: "form-data", label: "form-data"},
  {value: "x-www-form-urlencoded", label: "x-www-form-urlencoded"},
  {value: "json", label: "JSON"},
  {value: "raw", label: "raw"},
  {value: "binary", label: "binary"},
];

const createRow = (): HttpKeyValueRow => ({
  id: crypto.randomUUID(),
  enabled: true,
  name: "",
  value: "",
});

function KeyValueTable({
  rows,
  onChange,
  addLabel,
}: {
  rows: HttpKeyValueRow[];
  onChange: (rows: HttpKeyValueRow[]) => void;
  addLabel: string;
}) {
  function updateRow(index: number, patch: Partial<HttpKeyValueRow>) {
    const nextRows = [...rows];
    nextRows[index] = {...nextRows[index], ...patch};
    onChange(nextRows);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, rowIndex) => rowIndex !== index));
  }

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={row.id || index} className="grid grid-cols-[auto_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2">
          <input
            aria-label="Enabled"
            className="mt-2"
            type="checkbox"
            checked={row.enabled ?? true}
            onChange={(event) => updateRow(index, {enabled: event.target.checked})}
          />
          <PanelInput
            placeholder="Name"
            value={row.name ?? ""}
            onChange={(event) => updateRow(index, {name: event.target.value})}
          />
          <PanelInput
            placeholder="Value"
            value={row.value ?? ""}
            onChange={(event) => updateRow(index, {value: event.target.value})}
          />
          <button
            className="rounded-xl border border-zinc-200 px-2 text-xs font-medium text-zinc-500 transition hover:bg-white"
            type="button"
            onClick={() => removeRow(index)}
          >
            Remove
          </button>
        </div>
      ))}
      <PanelButton onClick={() => onChange([...rows, createRow()])}>{addLabel}</PanelButton>
    </div>
  );
}

export default function HttpPanel({node, patchNodeData}: NodePanelProps) {
  const data = (node.data ?? {}) as HttpNodeData;
  const bodyType = data.body_type ?? "none";
  const headers = data.headers ?? [];
  const params = data.params ?? [];
  const formData = data.body_form_data ?? [];
  const urlencoded = data.body_urlencoded ?? [];

  return (
    <div className="space-y-4">
      <PanelCard>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800">Request</p>
        </div>

        <PanelField label="Label">
          <PanelInput value={data.label ?? "HTTP"} onChange={(event) => patchNodeData({label: event.target.value})} />
        </PanelField>

        <div className="grid grid-cols-[140px_minmax(0,1fr)] gap-3">
          <PanelField label="Method">
            <select
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              value={data.method ?? "GET"}
              onChange={(event) => patchNodeData({method: event.target.value as HttpMethod})}
            >
              {METHODS.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </PanelField>

          <PanelField label="URL">
            <PanelInput value={data.url ?? ""} onChange={(event) => patchNodeData({url: event.target.value})} />
          </PanelField>
        </div>

        <label className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2">
          <span className="text-sm font-medium text-zinc-700">Skip SSL verification</span>
          <input
            type="checkbox"
            checked={data.skip_ssl_verification ?? false}
            onChange={(event) => patchNodeData({skip_ssl_verification: event.target.checked})}
          />
        </label>
      </PanelCard>

      <PanelCard>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800">Headers</p>
        </div>
        <KeyValueTable rows={headers} addLabel="Add Header" onChange={(rows) => patchNodeData({headers: rows})} />
      </PanelCard>

      <PanelCard>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800">Params</p>
        </div>
        <KeyValueTable rows={params} addLabel="Add Param" onChange={(rows) => patchNodeData({params: rows})} />
      </PanelCard>

      <PanelCard>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800">Body</p>
        </div>

        <PanelField label="Body Type">
          <select
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            value={bodyType}
            onChange={(event) => patchNodeData({body_type: event.target.value as HttpBodyType})}
          >
            {BODY_TYPES.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </PanelField>

        {bodyType === "form-data" ? (
          <KeyValueTable rows={formData} addLabel="Add Form Field" onChange={(rows) => patchNodeData({body_form_data: rows})} />
        ) : null}

        {bodyType === "x-www-form-urlencoded" ? (
          <KeyValueTable rows={urlencoded} addLabel="Add URL Encoded Field" onChange={(rows) => patchNodeData({body_urlencoded: rows})} />
        ) : null}

        {bodyType === "json" ? (
          <PanelField label="JSON">
            <textarea
              className="min-h-40 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              placeholder='{"key": "value"}'
              value={data.body_json ?? ""}
              onChange={(event) => patchNodeData({body_json: event.target.value})}
            />
          </PanelField>
        ) : null}

        {bodyType === "raw" ? (
          <PanelField label="Raw">
            <textarea
              className="min-h-40 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              value={data.body_raw ?? ""}
              onChange={(event) => patchNodeData({body_raw: event.target.value})}
            />
          </PanelField>
        ) : null}

        {bodyType === "binary" ? (
          <PanelField label="Binary">
            <textarea
              className="min-h-32 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
              placeholder="Binary payload or template value"
              value={data.body_binary ?? ""}
              onChange={(event) => patchNodeData({body_binary: event.target.value})}
            />
          </PanelField>
        ) : null}
      </PanelCard>
    </div>
  );
}
