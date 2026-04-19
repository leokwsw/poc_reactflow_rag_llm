import type { Edge, Node } from "reactflow";
import type { WorkflowDataType } from "@/app/components/workflow/types";

type WorkflowFile = {
  name: string;
  type: string;
  size: number;
  text?: string;
};

type WorkflowTraceItem = {
  nodeId: string;
  nodeType: string;
  status: "pending" | "running" | "completed";
  detail?: string;
};

type WorkflowRunInput = {
  query: string;
  files: WorkflowFile[];
};

type WorkflowRunResult = {
  output: string;
  outputs: Record<string, unknown>;
  trace: WorkflowTraceItem[];
};

type NodeOutputMap = Record<string, Record<string, unknown>>;

type LlmNodeConfig = {
  apiBaseUrl?: string;
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
};

function getNodeType(node: Node) {
  return String(node.data?.type ?? node.type ?? "unknown");
}

function getIncomingEdges(nodeId: string, edges: Edge[]) {
  return edges.filter((edge) => edge.target === nodeId);
}

function getOutgoingEdges(nodeId: string, edges: Edge[]) {
  return edges.filter((edge) => edge.source === nodeId);
}

function normalizeExpression(expression: string) {
  return expression
    .trim()
    .replace(/^\{\{/, "")
    .replace(/\}\}$/, "")
    .replace(/^#/, "")
    .replace(/#$/g, "");
}

function getValueByPath(value: unknown, path: string[]) {
  let current = value;
  for (const key of path) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

function resolveExpression(
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

function summarizeFiles(files: WorkflowFile[]) {
  if (files.length === 0) return "";

  return files
    .map((file, index) => {
      const header = `File ${index + 1}: ${file.name} (${file.type || "unknown"}, ${file.size} bytes)`;
      if (!file.text) return header;
      return `${header}\n${file.text.slice(0, 12000)}`;
    })
    .join("\n\n");
}

async function executeLlmNode(
  node: Node,
  input: WorkflowRunInput,
  nodeOutputs: NodeOutputMap,
  incomingEdges: Edge[],
) {
  const config = (node.data ?? {}) as LlmNodeConfig & { label?: string };
  const firstParent = incomingEdges[0]?.source;
  const parentOutput = firstParent ? nodeOutputs[firstParent] : undefined;
  const upstreamText =
    typeof parentOutput?.text === "string"
      ? parentOutput.text
      : typeof parentOutput?.query === "string"
        ? parentOutput.query
        : input.query;

  const apiBaseUrl = (config.apiBaseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
  const model = config.model || process.env.OPENAI_MODEL;

  if (!apiKey) {
    throw new Error(`LLM node "${node.id}" is missing apiKey, and OPENAI_API_KEY is not set.`);
  }
  if (!model) {
    throw new Error(`LLM node "${node.id}" is missing model.`);
  }

  const fileSummary = summarizeFiles(input.files);
  const userContent = [upstreamText, fileSummary ? `Attached files:\n${fileSummary}` : ""]
    .filter(Boolean)
    .join("\n\n");

  const messages = [
    config.systemPrompt
      ? {
          role: "system",
          content: config.systemPrompt,
        }
      : null,
    {
      role: "user",
      content: userContent,
    },
  ].filter(Boolean);

  const response = await fetch(`${apiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: typeof config.temperature === "number" ? config.temperature : 0.7,
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; text?: string }>;
      };
    }>;
    usage?: Record<string, unknown>;
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || `LLM request failed with status ${response.status}.`);
  }

  const content = payload.choices?.[0]?.message?.content;
  const text = typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content
          .map((part) => (part?.type === "text" ? part.text || "" : ""))
          .join("")
      : "";

  return {
    text,
    usage: payload.usage ?? {},
    model,
  };
}

export async function runWorkflow(
  workflow: WorkflowDataType,
  input: WorkflowRunInput,
): Promise<WorkflowRunResult> {
  const nodes = workflow.nodes;
  const edges = workflow.edges;
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const aliasMap = new Map<string, string>();
  const trace: WorkflowTraceItem[] = [];
  const nodeOutputs: NodeOutputMap = {};

  nodes.forEach((node) => {
    const label = typeof node.data?.label === "string" ? node.data.label : undefined;
    if (label) aliasMap.set(label, node.id);
  });

  const startNode = nodes.find((node) => getNodeType(node) === "start");
  if (!startNode) {
    throw new Error("Workflow requires one start node.");
  }

  const reachableNodeIds = new Set<string>();
  const queue = [startNode.id];
  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId || reachableNodeIds.has(nodeId)) continue;
    reachableNodeIds.add(nodeId);

    for (const edge of getOutgoingEdges(nodeId, edges)) {
      queue.push(edge.target);
    }
  }

  const inDegree = new Map<string, number>();
  reachableNodeIds.forEach((nodeId) => {
    const degree = edges.filter((edge) => edge.target === nodeId && reachableNodeIds.has(edge.source)).length;
    inDegree.set(nodeId, degree);
  });

  const ready = Array.from(reachableNodeIds).filter((nodeId) => (inDegree.get(nodeId) ?? 0) === 0);
  const executionOrder: string[] = [];
  while (ready.length > 0) {
    const nodeId = ready.shift()!;
    executionOrder.push(nodeId);

    for (const edge of getOutgoingEdges(nodeId, edges)) {
      if (!reachableNodeIds.has(edge.target)) continue;
      const nextDegree = (inDegree.get(edge.target) ?? 0) - 1;
      inDegree.set(edge.target, nextDegree);
      if (nextDegree === 0) ready.push(edge.target);
    }
  }

  if (executionOrder.length !== reachableNodeIds.size) {
    throw new Error("Workflow contains a cycle or unsupported graph structure.");
  }

  let finalOutput = "";
  let finalOutputs: Record<string, unknown> = {};

  for (const nodeId of executionOrder) {
    const node = nodeMap.get(nodeId);
    if (!node) continue;

    const nodeType = getNodeType(node);
    trace.push({ nodeId, nodeType, status: "running" });

    if (nodeType === "start") {
      nodeOutputs[nodeId] = {
        query: input.query,
        files: input.files,
      };
      trace[trace.length - 1] = {
        nodeId,
        nodeType,
        status: "completed",
        detail: `query=${input.query.length} chars, files=${input.files.length}`,
      };
      continue;
    }

    if (nodeType === "llm") {
      const incomingEdges = getIncomingEdges(nodeId, edges);
      nodeOutputs[nodeId] = await executeLlmNode(node, input, nodeOutputs, incomingEdges);
      trace[trace.length - 1] = {
        nodeId,
        nodeType,
        status: "completed",
        detail: `model=${String(nodeOutputs[nodeId]?.model ?? "")}`,
      };
      continue;
    }

    if (nodeType === "end") {
      const configuredOutputs = Array.isArray(node.data?.outputs) ? (node.data.outputs as string[]) : [];
      const incomingEdges = getIncomingEdges(nodeId, edges);
      const fallbackSourceId = incomingEdges[0]?.source;
      const outputExpressions = configuredOutputs.length > 0
        ? configuredOutputs
        : fallbackSourceId
          ? [`${fallbackSourceId}.text`]
          : [];

      finalOutputs = {};
      outputExpressions.forEach((expression, index) => {
        finalOutputs[expression] = resolveExpression(expression, nodeOutputs, aliasMap);
        if (index === 0 && typeof finalOutputs[expression] === "string") {
          finalOutput = finalOutputs[expression] as string;
        }
      });

      if (!finalOutput && fallbackSourceId) {
        finalOutput = String(nodeOutputs[fallbackSourceId]?.text ?? "");
      }

      nodeOutputs[nodeId] = {
        output: finalOutput,
        outputs: finalOutputs,
      };
      trace[trace.length - 1] = {
        nodeId,
        nodeType,
        status: "completed",
        detail: `outputs=${outputExpressions.length}`,
      };
      continue;
    }

    throw new Error(`Unsupported node type "${nodeType}" in runner. Current runner only supports start -> llm -> end.`);
  }

  return {
    output: finalOutput,
    outputs: finalOutputs,
    trace,
  };
}
