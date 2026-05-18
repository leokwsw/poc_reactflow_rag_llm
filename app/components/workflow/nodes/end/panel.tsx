"use client";

import {
  PanelButton,
  PanelCard,
  PanelField,
  PanelInput,
} from "@/app/components/workflow/nodes/_base/panel-form";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";
import WorkflowPromptEditor from "../../prompt-editor";
import type { WorkflowPromptVariableOption } from "../../prompt-editor/utils";
import { useMemo } from "react";

type EndNodeData = {
  label?: string;
  answer?: string;
  outputs?: string[];
};

type OutputToken = {
  raw: string;
  source: string;
  field: string;
};

function normalizeExpression(expression: string) {
  return expression
    .trim()
    .replace(/^\{\{#\s*/, "")
    .replace(/\s*#\}\}$/, "");
}

function parseOutputToken(expression: string): OutputToken | null {
  const normalized = normalizeExpression(expression);
  if (!normalized) {
    return null;
  }

  const parts = normalized.split(".").filter(Boolean);
  if (parts.length === 0) {
    return null;
  }

  return {
    raw: normalized,
    source: parts[0],
    field: parts.slice(1).join(".") || "output",
  };
}

function extractOutputTokens(answer?: string, outputs?: string[]) {
  if (Array.isArray(outputs) && outputs.length > 0) {
    return outputs.map(parseOutputToken).filter(Boolean) as OutputToken[];
  }

  if (!answer) {
    return [];
  }

  const matches = Array.from(answer.matchAll(/\{\{#\s*([^}]+?)\s*#\}\}/g));
  return matches
    .map((match) => parseOutputToken(match[1] ?? ""))
    .filter(Boolean) as OutputToken[];
}

function getNodeDisplayLabel(nodeId: string, labelMap: Map<string, string>) {
  return labelMap.get(nodeId) || nodeId;
}

function getVariableOptions(allNodes: NodePanelProps["allNodes"], currentNodeId: string, labelMap: Map<string, string>) {
  const nodes = allNodes ?? [];

  return nodes.flatMap((item): WorkflowPromptVariableOption[] => {
    if (item.id === currentNodeId) {
      return [];
    }

    const nodeType = String(item.data?.type ?? "");
    const nodeLabel = getNodeDisplayLabel(item.id, labelMap);

    const fields: Array<{ name: string; typeLabel: string }> = (() => {
      switch (nodeType) {
        case "start":
          return [
            { name: "query", typeLabel: "String" },
            { name: "files", typeLabel: "Array[File]" },
          ];
        case "llm":
        case "agent":
          return [
            { name: "text", typeLabel: "String" },
            { name: "usage", typeLabel: "Object" },
            { name: "model", typeLabel: "String" },
          ];
        case "questionClassifier":
          return [
            { name: "class_id", typeLabel: "String" },
            { name: "class_name", typeLabel: "String" },
            { name: "keywords", typeLabel: "Array[String]" },
            { name: "usage", typeLabel: "Object" },
            { name: "model", typeLabel: "String" },
          ];
        case "documentExtractor":
          return [
            { name: "documents", typeLabel: "Array[Object]" },
            { name: "text", typeLabel: "String" },
          ];
        case "http":
          return [
            { name: "status_code", typeLabel: "Number" },
            { name: "body", typeLabel: "Object" },
            { name: "headers", typeLabel: "Object" },
          ];
        case "code":
          return [
            { name: "result", typeLabel: "Any" },
          ];
        case "templateTransform":
          return [
            { name: "output", typeLabel: "String" },
          ];
        case "assigner":
        case "variableAssigner":
        case "variableAggregator":
          return [
            { name: "output", typeLabel: "Any" },
          ];
        case "knowledgeRetrieval":
          return [
            { name: "documents", typeLabel: "Array[Object]" },
          ];
        default:
          return [
            { name: "output", typeLabel: "Any" },
          ];
      }
    })();

    return fields.map((field) => ({
      key: `${item.id}.${field.name}`,
      label: `${nodeLabel}/${field.name}`,
      typeLabel: field.typeLabel,
      expression: `${item.id}.${field.name}`,
    }));
  });
}

export default function EndPanel({ node, patchNodeData, allNodes = [] }: NodePanelProps) {
  const data = (node.data ?? {}) as EndNodeData;
  const labelMap = useMemo(() => {
    return new Map(
      allNodes.map((item) => {
        const nodeData = (item.data ?? {}) as Record<string, unknown>;
        const label = typeof nodeData.label === "string" ? nodeData.label.trim() : "";
        const title = typeof nodeData.title === "string" ? nodeData.title.trim() : "";

        return [item.id, label || title || item.id] as const;
      }),
    );
  }, [allNodes]);

  const templateValue = data.answer ?? (data.outputs ?? []).join("\n");
  const previewTokens = extractOutputTokens(data.answer, data.outputs);
  const hasImportedOutputs = !data.answer?.trim() && (data.outputs?.length ?? 0) > 0;
  const variableOptions = useMemo(
    () => getVariableOptions(allNodes, node.id, labelMap),
    [allNodes, node.id, labelMap],
  );

  return (
    <div className="space-y-4">
      <PanelCard>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800">Answer Node</p>
        </div>

        <PanelField label="Label">
          <PanelInput value={data.label ?? "Answer"} onChange={(event) => patchNodeData({ label: event.target.value })} />
        </PanelField>
      </PanelCard>

      <PanelCard>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-zinc-800">Output Template</p>
        </div>

        <PanelField label="">
          <div className="relative">
            <WorkflowPromptEditor
              value={templateValue}
              variableOptions={variableOptions}
              minHeightClassName="min-h-[144px]"
              placeholder={"Write answer template here, use / to insert variables\n\nDeepSeek:\n{{#llm.text#}}\n\nQwen:\n{{#llm_2.text#}}"}
              onChange={(nextValue) => {
                patchNodeData({
                  answer: nextValue,
                  outputs: extractOutputTokens(nextValue).map((token) => token.raw),
                });
              }}
            />
          </div>
        </PanelField>

        {hasImportedOutputs && (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-amber-700">Imported Outputs</p>
            <p className="mt-1 text-xs leading-5 text-amber-800">
              呢個 answer node 目前由 outputs list 匯入。你而家可以直接喺上面 Raw Template 編輯最終內容。
            </p>
            <div className="mt-2 space-y-1.5">
              {previewTokens.map((token, index) => (
                <div
                  key={`${token.raw}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-white/90 px-2.5 py-1.5 text-[11px]"
                >
                  <span className="min-w-0 truncate font-medium text-zinc-700">
                    {getNodeDisplayLabel(token.source, labelMap)}
                  </span>
                  <span className="shrink-0 rounded-md bg-indigo-50 px-1.5 py-0.5 font-mono text-[10px] text-indigo-600">
                    {"{"}{token.field}{"}"}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <PanelButton
                onClick={() =>
                  patchNodeData({
                    answer: (data.outputs ?? []).map((item) => `{{#${normalizeExpression(item)}#}}`).join("\n"),
                    outputs: previewTokens.map((token) => token.raw),
                  })}
              >
                Convert To Raw Template
              </PanelButton>
            </div>
          </div>
        )}
      </PanelCard>
    </div>
  );
}
