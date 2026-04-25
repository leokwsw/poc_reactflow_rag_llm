import type { Edge, Node } from "reactflow";
import type {
  NodeExecutionResult,
  NodeOutputMap,
  WorkflowFile,
} from "@/app/components/workflow/nodes/execution-types";

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
    .replace(/^\{\{#\s*/, "")
    .replace(/\s*#\}\}$/, "");
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

function sanitizeValue(key: string, value: unknown): unknown {
  if (/(api.?key|authorization|token|secret|password)/i.test(key)) {
    return value ? "***" : "";
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      item && typeof item === "object"
        ? sanitizeRecord(item as Record<string, unknown>)
        : item,
    );
  }

  if (value && typeof value === "object") {
    return sanitizeRecord(value as Record<string, unknown>);
  }

  return value;
}

export function sanitizeRecord(record: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, sanitizeValue(key, value)]),
  );
}

export function buildGenericTraceInput(nodeId: string, edges: Edge[], nodeOutputs: NodeOutputMap) {
  const incomingEdges = getIncomingEdges(nodeId, edges);
  if (incomingEdges.length === 0) {
    return {};
  }

  if (incomingEdges.length === 1) {
    const sourceId = incomingEdges[0].source;
    return sanitizeRecord(structuredClone(nodeOutputs[sourceId] ?? {}));
  }

  return sanitizeRecord(
    Object.fromEntries(
      incomingEdges.map((edge) => [edge.source, structuredClone(nodeOutputs[edge.source] ?? {})]),
    ),
  );
}

export function buildGenericTraceProcessData(node: Node) {
  const nodeData = ((node.data ?? {}) as Record<string, unknown>);
  const filtered = Object.fromEntries(
    Object.entries(nodeData).filter(([key]) => !["type", "label", "runStatus"].includes(key)),
  );
  return sanitizeRecord(structuredClone(filtered));
}

export function buildTraceSections(args: {
  node: Node;
  nodeId: string;
  edges: Edge[];
  nodeOutputs: NodeOutputMap;
  result?: NodeExecutionResult;
}) {
  const { node, nodeId, edges, nodeOutputs, result } = args;

  return {
    input: structuredClone(result?.traceInput ?? buildGenericTraceInput(nodeId, edges, nodeOutputs)),
    processData: structuredClone(result?.traceProcessData ?? buildGenericTraceProcessData(node)),
    output: structuredClone(result?.traceOutput ?? result?.output ?? nodeOutputs[nodeId] ?? {}),
  };
}
