import type {NodeExecutionContext, NodeExecutionResult} from "@/app/components/workflow/nodes/execution-types";
import {getIncomingEdges, summarizeFiles} from "@/app/components/workflow/nodes/execution-utils";
import {getInputValue, interpolateTemplate} from "@/app/components/workflow/nodes/_base/execution-helpers";
import { resolveModelConfig } from "@/app/model/data";

type LlmNodeConfig = {
  model?: string;
  temperature?: number;
  context_variable?: string;
  messages?: Array<{
    role?: "system" | "user" | "assistant";
    content?: string;
  }>;
  vision_enable?: boolean;
};

function hasContextPlaceholder(messages: Array<{ content?: string }>) {
  return messages.some((message) => (message.content ?? "").includes("{{#context#}}"));
}

function renderMessageContent(content: string, context: NodeExecutionContext, contextValue: unknown) {
  const withContext = content.replace(/\{\{#\s*context\s*#\}\}/g, () => {
    if (contextValue === null || contextValue === undefined) {
      return "";
    }
    if (typeof contextValue === "string") {
      return contextValue;
    }
    return JSON.stringify(contextValue);
  });

  return interpolateTemplate(withContext, context);
}

function getRenderedMessages(config: LlmNodeConfig, context: NodeExecutionContext, upstreamText: string) {
  const configuredMessages = Array.isArray(config.messages) ? config.messages : [];
  const contextValue = config.context_variable ? getInputValue(context, config.context_variable) : undefined;

  if (config.context_variable && !hasContextPlaceholder(configuredMessages)) {
    throw new Error(`LLM node "${context.node.id}" requires {{#context#}} in one of its own messages when Context Variable is selected.`);
  }

  if (configuredMessages.length > 0) {
    return configuredMessages.map((message, index) => ({
      role: index === 0 ? "system" : (message.role === "assistant" || message.role === "system" ? message.role : "user"),
      content: renderMessageContent(message.content || "", context, contextValue),
    }));
  }

  const fileSummary = summarizeFiles(context.input.files);
  return [
    {
      role: "system" as const,
      content: "You are a helpful assistant.",
    },
    {
      role: "user" as const,
      content: [upstreamText, fileSummary ? `Attached files:\n${fileSummary}` : ""]
        .filter(Boolean)
        .join("\n\n"),
    },
  ];
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

  const modelConfig = await resolveModelConfig(config.model);
  const apiBaseUrl = modelConfig.apiBaseUrl;
  const apiKey = modelConfig.apiKey;
  const model = modelConfig.model;

  if (!apiKey) {
    throw new Error(`Model profile "${modelConfig.id}" is missing api key, and OPENAI_API_KEY is not set.`);
  }
  if (!model) {
    throw new Error(`Model profile "${modelConfig.id}" is missing provider model.`);
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
  const messages = getRenderedMessages(config, contextObject, upstreamText)
    .filter((message) => message.content.trim().length > 0 || message.role === "system");

  const response = await fetch(`${apiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      model_profile: modelConfig.id,
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
    detail: `model=${modelConfig.id}`,
    traceInput: {},
    traceProcessData: {
      model_mode: "chat",
      prompts: messages.map((message) => ({
        files: message.role === "user" ? input.files : [],
        role: message.role,
        text: message.content,
      })),
      usage: payload.usage ?? {},
      finish_reason: finishReason,
      model_name: model,
      model_profile: modelConfig.id,
    },
    traceOutput: {
      text,
      reasoning_content: reasoningContent,
      usage: payload.usage ?? {},
      finish_reason: finishReason,
    },
  };
}
