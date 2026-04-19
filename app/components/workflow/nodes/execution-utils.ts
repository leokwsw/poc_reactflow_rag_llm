import type { Edge, Node } from "reactflow";
import type { NodeOutputMap, WorkflowFile } from "@/app/components/workflow/nodes/execution-types";

export function getNodeType(node: Node) {
  return String(node.data?.type ?? node.type ?? "unknown");
}

export function getIncomingEdges(nodeId: string, edges: Edge[]) {
  return edges.filter((edge) => edge.target === nodeId);
}

export function getOutgoingEdges(nodeId: string, edges: Edge[]) {
  return edges.filter((edge) => edge.source === nodeId);
}

export function normalizeExpression(expression: string) {
  return expression
    .trim()
    .replace(/^\{\{/, "")
    .replace(/\}\}$/, "")
    .replace(/^#/, "")
    .replace(/#$/g, "");
}

export function getValueByPath(value: unknown, path: string[]) {
  let current = value;
  for (const key of path) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

export function resolveExpression(
  expression: string,
  nodeOutputs: NodeOutputMap,
  aliasMap: Map<string, string>,
) {
  const normalized = normalizeExpression(expression);
  if (!normalized) return undefined;

  const parts = normalized.split(".").filter(Boolean);
  if (parts.length === 0) return undefined;

  const first = parts[0];
  const nodeId = nodeOutputs[first] ? first : aliasMap.get(first);
  if (!nodeId) return undefined;

  return getValueByPath(nodeOutputs[nodeId], parts.slice(1));
}

export function summarizeFiles(files: WorkflowFile[]) {
  if (files.length === 0) return "";

  return files
    .map((file, index) => {
      const header = `File ${index + 1}: ${file.name} (${file.type || "unknown"}, ${file.size} bytes)`;
      if (!file.text) return header;
      return `${header}\n${file.text.slice(0, 12000)}`;
    })
    .join("\n\n");
}

