import type { Edge } from "reactflow";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";
import type { WorkflowPromptVariableOption } from "../prompt-editor/utils";

function getAncestorNodeIds(currentNodeId: string, edges: Edge[]) {
  const parentsByTarget = new Map<string, string[]>();
  edges.forEach((edge) => {
    const existing = parentsByTarget.get(edge.target) ?? [];
    existing.push(edge.source);
    parentsByTarget.set(edge.target, existing);
  });

  const visited = new Set<string>();
  const stack = [...(parentsByTarget.get(currentNodeId) ?? [])];

  while (stack.length > 0) {
    const nodeId = stack.pop()!;
    if (visited.has(nodeId)) {
      continue;
    }
    visited.add(nodeId);
    (parentsByTarget.get(nodeId) ?? []).forEach((parentId) => {
      if (!visited.has(parentId)) {
        stack.push(parentId);
      }
    });
  }

  return visited;
}

export function getContextOptions(
  allNodes: NodePanelProps["allNodes"],
  allEdges: NodePanelProps["allEdges"],
  currentNodeId: string,
) {
  const nodes = allNodes ?? [];
  const ancestorNodeIds = getAncestorNodeIds(currentNodeId, allEdges ?? []);

  return nodes.flatMap((item) => {
    if (!ancestorNodeIds.has(item.id)) {
      return [];
    }

    const nodeType = String(item.data?.type ?? "");
    const nodeLabel =
      typeof item.data?.label === "string" && item.data.label.trim() ? item.data.label.trim() : item.id;

    const fields: string[] = (() => {
      switch (nodeType) {
        case "start":
          return ["query", "files"];
        case "llm":
        case "agent":
          return ["text", "usage", "model"];
        case "questionClassifier":
          return ["class_id", "class_name", "keywords"];
        case "documentExtractor":
          return ["documents", "text"];
        case "http":
          return ["status_code", "body", "headers"];
        default:
          return ["output"];
      }
    })();

    return fields.map((field) => ({
      value: `${item.id}.${field}`,
      label: `(${nodeLabel}/${field})`,
    }));
  });
}

export function getPromptVariableOptions(
  allNodes: NodePanelProps["allNodes"],
  allEdges: NodePanelProps["allEdges"],
  currentNodeId: string,
  contextVariable?: string,
): WorkflowPromptVariableOption[] {
  const contextOptions = getContextOptions(allNodes, allEdges, currentNodeId);
  const options: WorkflowPromptVariableOption[] = contextOptions.map((option) => ({
    key: option.value,
    expression: option.value,
    label: option.label.replace(/^\(|\)$/g, ""),
  }));

  if (contextVariable) {
    options.unshift({
      key: "context",
      expression: "context",
      label: "context",
      typeLabel: "Context",
    });
  }

  return options;
}
