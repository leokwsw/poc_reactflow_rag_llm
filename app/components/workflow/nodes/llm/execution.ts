import type {NodeExecutionContext, NodeExecutionResult} from "@/app/components/workflow/nodes/execution-types";
import {getIncomingEdges, summarizeFiles} from "@/app/components/workflow/nodes/execution-utils";
import {interpolateTemplate} from "@/app/components/workflow/nodes/_base/execution-helpers";

type LlmNodeConfig = {
  apiBaseUrl?: string;
  apiKey?: string;
  model?: string;
  systemPrompt?: string;
  temperature?: number;
  prompt_template?: Array<{
    role?: string;
    text?: string;
  }>;
  memory?: {
    query_prompt_template?: string;
  };
};

function getRenderedUserPrompt(config: LlmNodeConfig, context: NodeExecutionContext, upstreamText: string) {
  const promptTemplateItems = Array.isArray(config.prompt_template)
    ? config.prompt_template.filter((item) => (item.role || "user") !== "system")
    : [];
  const promptTemplateText = promptTemplateItems
    .map((item) => interpolateTemplate(item.text || "", context))
    .filter((item) => item.trim().length > 0)
    .join("\n\n");

  if (promptTemplateText) {
    return promptTemplateText;
  }

  const queryPromptTemplate = config.memory?.query_prompt_template?.trim();
  if (queryPromptTemplate) {
    return interpolateTemplate(queryPromptTemplate, context);
  }

  const fileSummary = summarizeFiles(context.input.files);
  return [upstreamText, fileSummary ? `Attached files:\n${fileSummary}` : ""]
    .filter(Boolean)
    .join("\n\n");
}

export async function executeLlmNode({
                                       node,
                                       nodeId,
                                       workflow,
                                       nodeOutputs,
                                       input,
                                       edges,
                                       aliasMap,
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
  const systemPrompt = Array.isArray(config.prompt_template)
    ? config.prompt_template.find((item) => item.role === "system")?.text || config.systemPrompt || ""
    : config.systemPrompt || "";

  if (!apiKey) {
    throw new Error(`LLM node "${node.id}" is missing apiKey, and OPENAI_API_KEY is not set.`);
  }
  if (!model) {
    throw new Error(`LLM node "${node.id}" is missing model.`);
  }

  const contextObject = {
    node,
    nodeId,
    workflow,
    input,
    edges,
    nodeOutputs,
    aliasMap,
  };
  const userContent = getRenderedUserPrompt(config, contextObject, upstreamText);

  const messages = [
    systemPrompt
      ? {
        role: "system",
        content: systemPrompt,
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
      finish_reason?: string;
      message?: {
        content?: string | Array<{ type?: string; text?: string }>;
        reasoning_content?: string;
      };
    }>;
    usage?: Record<string, unknown>;
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || `LLM request failed with status ${response.status}.`);
  }

  const content = payload.choices?.[0]?.message?.content;
  const finishReason = payload.choices?.[0]?.finish_reason || "stop";
  const reasoningContent = typeof payload.choices?.[0]?.message?.reasoning_content === "string"
    ? payload.choices?.[0]?.message?.reasoning_content
    : "";
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
      reasoning_content: reasoningContent,
      usage: payload.usage ?? {},
      finish_reason: finishReason,
      model,
    },
    detail: `model=${model}`,
    traceInput: {},
    traceProcessData: {
      model_mode: "chat",
      prompts: [
        {
          files: input.files,
          role: "user",
          text: userContent,
        },
      ],
      usage: payload.usage ?? {},
      finish_reason: finishReason,
      model_name: model,
      ...(systemPrompt ? { system_prompt: systemPrompt } : {}),
    },
    traceOutput: {
      text,
      reasoning_content: reasoningContent,
      usage: payload.usage ?? {},
      finish_reason: finishReason,
    },
  };
}
