import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import { getIncomingEdges, summarizeFiles } from "@/app/components/workflow/nodes/execution-utils";

type LlmNodeConfig = {
  apiBaseUrl?: string;
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
};

export async function executeLlmNode({
  node,
  nodeOutputs,
  input,
  edges,
}: NodeExecutionContext): Promise<NodeExecutionResult> {
  const config = (node.data ?? {}) as LlmNodeConfig & { label?: string };
  const incomingEdges = getIncomingEdges(node.id, edges);
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
    output: {
      text,
      usage: payload.usage ?? {},
      model,
    },
    detail: `model=${model}`,
  };
}

