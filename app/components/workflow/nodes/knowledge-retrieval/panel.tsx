"use client";

import {useEffect, useMemo, useRef, useState} from "react";
import {PanelField, PanelInput} from "@/app/components/workflow/nodes/_base/panel-form";
import type {NodePanelProps} from "@/app/components/workflow/nodes/panel-types";
import {getContextOptions} from "@/app/components/workflow/nodes/prompt-variable-options";

type Dataset = {
  id: string;
  name: string;
};

type KnowledgeRetrievalNodeData = {
  label?: string;
  query?: string;
  datasets?: Dataset[];
  retrieval_sources?: RetrievalSource[];
  graph_engines?: GraphEngine[];
  rag_modes?: RagMode[];
};

type RagMode = "hybrid" | "conversational" | "feedback" | "agentic" | "adaptive";
type RetrievalSource = "vector" | "bm25" | "neo4j" | "arangodb";
type GraphEngine = "neo4j" | "arangodb";

type ApiDataset = {
  id: string;
  title: string;
};

function IconPlus({className}: {className?: string}) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconTrash({className}: {className?: string}) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

const selectLightClass =
  "w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100";

const retrievalOptions: Array<{value: RetrievalSource; label: string; description: string}> = [
  {value: "vector", label: "Vector", description: "Elasticsearch dense-vector KNN"},
  {value: "bm25", label: "BM25", description: "Elasticsearch keyword search"},
  {value: "neo4j", label: "Neo4j", description: "Graph relation traversal"},
  {value: "arangodb", label: "ArangoDB", description: "AQL graph relation traversal"},
];

const ragModeOptions: Array<{value: RagMode; label: string; description: string}> = [
  {value: "hybrid", label: "Hybrid", description: "Fuse vector, BM25, and graph results"},
  {value: "conversational", label: "Conversational", description: "Use previous turns to rewrite retrieval context"},
  {value: "feedback", label: "Feedback", description: "Boost or suppress chunks from feedback history"},
  {value: "agentic", label: "Agentic", description: "Split the question into multiple retrieval subqueries"},
  {value: "adaptive", label: "Adaptive", description: "Choose retrieval sources from query intent"},
];

/** 從節點資料讀出單一變數運算式（僅支援 `{{#a.b#}}` 或純 `a.b`）。 */
function parseQueryVariableExpression(template: string | undefined): string {
  const t = (template ?? "").trim();
  const wrapped = t.match(/^\{\{#\s*([^#}]+?)\s*#\}\}\s*$/);
  if (wrapped) {
    return wrapped[1].trim();
  }
  if (/^[\w.-]+$/.test(t) && !/\s/.test(t)) {
    return t;
  }
  return "";
}

export default function KnowledgeRetrievalPanel({node, patchNodeData, allNodes, allEdges}: NodePanelProps) {
  const data = (node.data ?? {}) as KnowledgeRetrievalNodeData;
  const datasets = useMemo(
    () => (Array.isArray(data.datasets) ? data.datasets : []),
    [data.datasets],
  );

  const [apiDatasets, setApiDatasets] = useState<ApiDataset[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const pickerWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/datasets");
        const payload = (await res.json().catch(() => ({}))) as {datasets?: ApiDataset[]; error?: string};
        if (!res.ok) {
          throw new Error(payload.error ?? `Failed to load datasets (${res.status})`);
        }
        if (!cancelled) {
          setApiDatasets(Array.isArray(payload.datasets) ? payload.datasets : []);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setApiDatasets([]);
          setLoadError(e instanceof Error ? e.message : "Could not load datasets.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!pickerOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = pickerWrapRef.current;
      if (el && !el.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [pickerOpen]);

  const selectOptions = useMemo(() => {
    const rows = Array.isArray(data.datasets) ? data.datasets : [];
    const byId = new Map<string, ApiDataset>();
    for (const d of apiDatasets) {
      if (d.id) byId.set(d.id, d);
    }
    for (const row of rows) {
      if (row.id && !byId.has(row.id)) {
        byId.set(row.id, {id: row.id, title: row.name || `${row.id}（已不存在）`});
      }
    }
    return Array.from(byId.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [apiDatasets, data.datasets]);

  const selectedIds = useMemo(() => new Set(datasets.map((d) => d.id).filter(Boolean)), [datasets]);
  const availableToAdd = useMemo(() => selectOptions.filter((d) => !selectedIds.has(d.id)), [selectOptions, selectedIds]);
  const retrievalSources = useMemo<RetrievalSource[]>(
    () => data.retrieval_sources?.length ? data.retrieval_sources : ["vector", "bm25", "neo4j", "arangodb"],
    [data.retrieval_sources],
  );
  const ragModes = useMemo<RagMode[]>(
    () => data.rag_modes?.length ? data.rag_modes : ["hybrid"],
    [data.rag_modes],
  );

  const queryVariableOptions = useMemo(() => {
    const upstream = getContextOptions(allNodes, allEdges, node.id);
    const builtIn = [{value: "sys.query", label: "使用者輸入 (sys.query)"}];
    const seen = new Set<string>(builtIn.map((o) => o.value));
    const merged = [...builtIn];
    for (const o of upstream) {
      if (!seen.has(o.value)) {
        seen.add(o.value);
        merged.push({value: o.value, label: o.label});
      }
    }
    return merged;
  }, [allNodes, allEdges, node.id]);

  const selectedQueryExpr = useMemo(() => {
    const expr = parseQueryVariableExpression(data.query);
    return expr || "sys.query";
  }, [data.query]);

  const queryOptionKeys = useMemo(() => new Set(queryVariableOptions.map((o) => o.value)), [queryVariableOptions]);
  const showOrphanQueryOption = Boolean(selectedQueryExpr && !queryOptionKeys.has(selectedQueryExpr));

  const setDatasetAt = (index: number, id: string, name: string) => {
    patchNodeData({
      datasets: datasets.map((item, itemIndex) => (itemIndex === index ? {id, name} : item)),
    });
  };

  const addDataset = (id: string, title: string) => {
    patchNodeData({datasets: [...datasets, {id, name: title}]});
    setPickerOpen(false);
    setEditingIndex(null);
  };

  const removeAt = (index: number) => {
    patchNodeData({datasets: datasets.filter((_, itemIndex) => itemIndex !== index)});
    setEditingIndex((cur) => (cur === index ? null : cur != null && cur > index ? cur - 1 : cur));
  };

  const toggleRetrievalSource = (source: RetrievalSource) => {
    const next = retrievalSources.includes(source)
      ? retrievalSources.filter((item) => item !== source)
      : [...retrievalSources, source];
    const safeNext = next.length > 0 ? next : [source];
    patchNodeData({
      retrieval_sources: safeNext,
      graph_engines: safeNext.filter((item): item is GraphEngine => item === "neo4j" || item === "arangodb"),
    });
  };

  const toggleRagMode = (mode: RagMode) => {
    const next = ragModes.includes(mode)
      ? ragModes.filter((item) => item !== mode)
      : [...ragModes, mode];
    patchNodeData({rag_modes: next.length > 0 ? next : ["hybrid"]});
  };

  return (
    <div className="space-y-4">
      <PanelField label="Label">
        <PanelInput value={data.label ?? "Knowledge Retrieval"} onChange={(event) => patchNodeData({label: event.target.value})} />
      </PanelField>

      {loadError ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">{loadError}</p>
      ) : null}

      <div className="space-y-1">
        <PanelField label="Query">
          <select
            className={selectLightClass}
            value={selectedQueryExpr}
            onChange={(event) => {
              const v = event.target.value;
              patchNodeData({query: v ? `{{#${v}#}}` : "{{#sys.query#}}"});
            }}
          >
            {showOrphanQueryOption ? (
              <option value={selectedQueryExpr}>
                （已斷線或舊格式）{selectedQueryExpr}
              </option>
            ) : null}
            {queryVariableOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </PanelField>
        <p className="text-xs text-gray-500">僅能從清單選擇一個變數作為查詢來源，無法輸入自訂文字。</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-3 text-gray-900 shadow-sm">
        <div className="border-b border-gray-200 pb-2.5 text-sm font-semibold tracking-wide text-gray-900">
          RAG modes
        </div>
        <div className="mt-3 grid gap-2">
          {ragModeOptions.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 transition hover:bg-gray-100"
            >
              <input
                checked={ragModes.includes(option.value)}
                className="mt-1 h-4 w-4 accent-indigo-600"
                type="checkbox"
                onChange={() => toggleRagMode(option.value)}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-gray-800">{option.label}</span>
                <span className="block text-xs text-gray-500">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-3 text-gray-900 shadow-sm">
        <div className="border-b border-gray-200 pb-2.5 text-sm font-semibold tracking-wide text-gray-900">
          Retrieval sources
        </div>
        <div className="mt-3 grid gap-2">
          {retrievalOptions.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 transition hover:bg-gray-100"
            >
              <input
                checked={retrievalSources.includes(option.value)}
                className="mt-1 h-4 w-4 accent-indigo-600"
                type="checkbox"
                onChange={() => toggleRetrievalSource(option.value)}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-gray-800">{option.label}</span>
                <span className="block text-xs text-gray-500">{option.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-3 text-gray-900 shadow-sm">
        <div ref={pickerWrapRef} className="relative">
          <div className="flex items-center justify-between gap-2 border-b border-gray-200 pb-2.5">
            <div className="flex min-w-0 items-center gap-1 text-sm font-semibold tracking-wide text-gray-900">
              <span>知識庫</span>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs text-gray-500">
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={selectOptions.length === 0}
                title="新增知識庫"
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPickerOpen((o) => !o);
                }}
              >
                <IconPlus className="h-5 w-5" />
              </button>
            </div>
          </div>

          {pickerOpen ? (
            <div
              className="absolute right-0 top-full z-20 mt-1 max-h-56 w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {availableToAdd.length === 0 ? (
                <div className="px-3 py-2.5 text-center text-xs text-gray-500">
                  {selectOptions.length === 0 ? "尚無資料集，請先到 Datasets 建立。" : "已加入全部資料集。"}
                </div>
              ) : (
                availableToAdd.map((d) => (
                  <button
                    key={d.id}
                    className="block w-full truncate px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
                    type="button"
                    onClick={() => addDataset(d.id, d.title)}
                  >
                    {d.title}
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className="mt-3 space-y-2">
          {datasets.length === 0 ? (
            <div className="flex min-h-[92px] items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 px-4 text-center text-xs leading-relaxed text-gray-500">
              點選「+」按鈕新增知識庫
            </div>
          ) : (
            datasets.map((dataset, index) => (
              <div
                key={`${dataset.id || "new"}-${index}`}
                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-base"
                  aria-hidden
                >
                  🤖
                </div>
                <div className="min-w-0 flex-1">
                  {editingIndex === index ? (
                    <select
                      autoFocus
                      className={selectLightClass}
                      value={dataset.id}
                      onBlur={() => setEditingIndex(null)}
                      onChange={(event) => {
                        const id = event.target.value;
                        const picked = selectOptions.find((d) => d.id === id);
                        setDatasetAt(index, id, picked?.title ?? "");
                      }}
                    >
                      <option value="">選擇資料集…</option>
                      {selectOptions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="truncate text-sm font-medium text-gray-700" title={dataset.name || dataset.id}>
                      {dataset.name || (dataset.id ? dataset.id : "未選擇")}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-50 hover:text-red-500"
                    title="移除"
                    type="button"
                    onClick={() => removeAt(index)}
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
