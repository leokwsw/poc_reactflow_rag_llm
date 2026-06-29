import type {NodeExecutionContext, NodeExecutionResult} from "@/app/components/workflow/nodes/execution-types";
import {getIncomingEdges, summarizeFiles} from "@/app/components/workflow/nodes/execution-utils";
import {getInputValue, getPrimaryParentOutput, interpolateTemplate} from "@/app/components/workflow/nodes/_base/execution-helpers";
import {callMcpTool, listMcpServers, type McpServer, type McpTool} from "@/app/mcp/data";
import {resolveModelConfig} from "@/app/model/data";

type AgentMessage = {
  role?: "system" | "user" | "assistant";
  content?: string;
};

type AgentNodeData = {
  model?: string;
  role?: string;
  instruction?: string;
  query?: string;
  context_variable?: string;
  messages?: AgentMessage[];
  maximumIterations?: number;
  tools?: Array<string | {tool_name?: string; name?: string}>;
  agent_parameters?: {
    instruction?: {value?: string};
    query?: {value?: string};
    model?: {value?: {model?: string}};
    tools?: {value?: Array<{tool_name?: string; name?: string}>};
    maximum_iterations?: {value?: number};
  };
};

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
};

type ToolCall = {
  id: string;
  type?: "function";
  function?: {
    name?: string;
    arguments?: string;
  };
};

type ResolvedAgentTool = {
  id: string;
  functionName: string;
  server: McpServer;
  tool: McpTool;
};

const DEFAULT_SYSTEM_PROMPT = "You are a helpful AI agent. Use tools when they can improve the answer.";
const SDK_WITH_OPTIONAL_KEY = new Set(["ollama", "lmstudio", "xinference", "openai-compatible"]);

const modelHeaders = (apiKey: string) => ({
  "Content-Type": "application/json",
  ...(apiKey ? {Authorization: `Bearer ${apiKey}`} : {}),
});

function hasContextPlaceholder(messages: AgentMessage[]) {
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

function getParentText(context: NodeExecutionContext) {
  const parentOutput = getPrimaryParentOutput(context);
  const incomingEdges = getIncomingEdges(context.node.id, context.edges);
  const firstParent = incomingEdges[0]?.source;

  return typeof parentOutput?.text === "string"
    ? parentOutput.text
    : typeof parentOutput?.query === "string"
      ? parentOutput.query
      : firstParent
        ? String(context.nodeOutputs[firstParent]?.text ?? context.nodeOutputs[firstParent]?.query ?? "")
        : "";
}

function getLegacyAgentInstruction(data: AgentNodeData) {
  return data.instruction?.trim()
    || data.agent_parameters?.instruction?.value?.trim()
    || data.role?.trim()
    || DEFAULT_SYSTEM_PROMPT;
}

function getLegacyAgentQuery(data: AgentNodeData, context: NodeExecutionContext, parentText: string) {
  const configuredQuery = data.query?.trim() || data.agent_parameters?.query?.value?.trim();
  if (configuredQuery) {
    const rendered = interpolateTemplate(configuredQuery, context).trim();
    if (rendered) {
      return rendered;
    }
  }

  if (parentText.trim()) {
    return parentText.trim();
  }

  return context.input.query;
}

function getRenderedMessages(config: AgentNodeData, context: NodeExecutionContext, parentText: string) {
  const configuredMessages = Array.isArray(config.messages) ? config.messages : [];
  const contextValue = config.context_variable ? getInputValue(context, config.context_variable) : undefined;

  if (config.context_variable && !hasContextPlaceholder(configuredMessages)) {
    throw new Error(`Agent node "${context.node.id}" requires {{#context#}} in one of its own messages when Context Variable is selected.`);
  }

  if (configuredMessages.length > 0) {
    return configuredMessages.map((message, index) => ({
      role: index === 0 ? "system" as const : (message.role === "assistant" || message.role === "system" ? message.role : "user" as const),
      content: renderMessageContent(message.content || "", context, contextValue),
    }));
  }

  const fileSummary = summarizeFiles(context.input.files);
  return [
    {
      role: "system" as const,
      content: getLegacyAgentInstruction(config),
    },
    {
      role: "user" as const,
      content: [
        getLegacyAgentQuery(config, context, parentText),
        fileSummary ? `Attached files:\n${fileSummary}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ];
}

function getSelectedToolIds(data: AgentNodeData) {
  const rawTools = data.tools ?? data.agent_parameters?.tools?.value ?? [];
  return rawTools
    .map((tool) => (typeof tool === "string" ? tool : tool.tool_name || tool.name || ""))
    .filter(Boolean);
}

function sanitizeFunctionName(value: string, fallback: string) {
  const sanitized = value.replace(/[^a-zA-Z0-9_-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 64);
  return sanitized || fallback;
}

function normalizeToolSchema(schema: unknown) {
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    return {type: "object", properties: {}};
  }

  return schema as Record<string, unknown>;
}

async function resolveSelectedTools(selectedToolIds: string[]): Promise<ResolvedAgentTool[]> {
  if (selectedToolIds.length === 0) {
    return [];
  }

  const selected = new Set(selectedToolIds);
  const servers = await listMcpServers();
  const resolved: ResolvedAgentTool[] = [];
  const usedFunctionNames = new Set<string>();

  for (const server of servers) {
    for (const tool of server.tools) {
      const id = `${server.server_identifier}:${tool.name}`;
      if (!selected.has(id) && !selected.has(tool.name)) {
        continue;
      }

      const baseName = sanitizeFunctionName(`${server.server_identifier}_${tool.name}`, `tool_${resolved.length + 1}`);
      let functionName = baseName;
      let suffix = 2;
      while (usedFunctionNames.has(functionName)) {
        functionName = sanitizeFunctionName(`${baseName}_${suffix}`, `tool_${resolved.length + 1}_${suffix}`);
        suffix += 1;
      }
      usedFunctionNames.add(functionName);

      resolved.push({
        id,
        functionName,
        server,
        tool,
      });
    }
  }

  return resolved;
}

function parseToolArguments(value: string | undefined) {
  if (!value?.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}

function extractTextContent(content: unknown) {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (!part || typeof part !== "object") {
          return "";
        }
        const item = part as Record<string, unknown>;
        return item.type === "text" ? String(item.text ?? "") : "";
      })
      .join("");
  }
  return "";
}

export async function executeAgentNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as AgentNodeData;
  const parentText = getParentText(context);
  const selectedToolIds = getSelectedToolIds(data);
  const resolvedTools = await resolveSelectedTools(selectedToolIds);
  const toolsByFunctionName = new Map(resolvedTools.map((tool) => [tool.functionName, tool]));
  const modelConfig = await resolveModelConfig(data.model || data.agent_parameters?.model?.value?.model);
  const api_base_url = modelConfig.api_base_url;
  const api_key = modelConfig.api_key;
  const model = modelConfig.model;
  const maximumIterations = Math.max(1, Math.min(20, data.maximumIterations
    ?? data.agent_parameters?.maximum_iterations?.value
    ?? 3));

  if (!api_key && !SDK_WITH_OPTIONAL_KEY.has(modelConfig.sdk)) {
    throw new Error(`Model profile "${modelConfig.id}" is missing api key, and OPENAI_API_KEY is not set.`);
  }
  if (!model) {
    throw new Error(`Model profile "${modelConfig.id}" is missing provider model.`);
  }

  const messages: ChatMessage[] = getRenderedMessages(data, context, parentText)
    .filter((message) => message.content.trim().length > 0 || message.role === "system")
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));
  const requestTools = resolvedTools.map((item) => ({
    type: "function",
    function: {
      name: item.functionName,
      description: item.tool.description || `${item.server.name}: ${item.tool.name}`,
      parameters: normalizeToolSchema(item.tool.inputSchema),
    },
  }));
  const toolCallsTrace: Array<{
    name: string;
    server: string;
    arguments: Record<string, unknown>;
    result: unknown;
  }> = [];
  let payload: {
    error?: {message?: string};
    choices?: Array<{
      finish_reason?: string;
      message?: {
        content?: string | Array<{type?: string; text?: string}>;
        reasoning_content?: string;
        tool_calls?: ToolCall[];
      };
    }>;
    usage?: Record<string, unknown>;
  } = {};

  for (let iteration = 0; iteration < maximumIterations; iteration += 1) {
    const response = await fetch(`${api_base_url}/chat/completions`, {
      method: "POST",
      headers: modelHeaders(api_key),
      body: JSON.stringify({
        model,
        model_profile: modelConfig.id,
        messages,
        temperature: 0.4,
        ...(requestTools.length > 0 ? {tools: requestTools, tool_choice: "auto"} : {}),
      }),
    });

    payload = await response.json() as typeof payload;

    if (!response.ok) {
      throw new Error(payload.error?.message || `Agent request failed with status ${response.status}.`);
    }

    const assistantMessage = payload.choices?.[0]?.message;
    const toolCalls = assistantMessage?.tool_calls ?? [];
    messages.push({
      role: "assistant",
      content: extractTextContent(assistantMessage?.content) || null,
      ...(toolCalls.length > 0 ? {tool_calls: toolCalls} : {}),
    });

    if (toolCalls.length === 0) {
      break;
    }

    for (const toolCall of toolCalls) {
      const functionName = toolCall.function?.name ?? "";
      const resolvedTool = toolsByFunctionName.get(functionName);
      const args = parseToolArguments(toolCall.function?.arguments);

      if (!resolvedTool) {
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify({error: `Unknown tool: ${functionName}`}),
        });
        continue;
      }

      const result = await callMcpTool({
        serverUrl: resolvedTool.server.server_url,
        toolName: resolvedTool.tool.name,
        arguments: args,
      });
      toolCallsTrace.push({
        name: resolvedTool.tool.name,
        server: resolvedTool.server.server_identifier,
        arguments: args,
        result,
      });
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }
  }

  const finalMessage = [...messages].reverse().find((message) => message.role === "assistant");
  const text = finalMessage?.content ?? "";
  const finishReason = payload.choices?.[0]?.finish_reason || "stop";
  const reasoningContent = typeof payload.choices?.[0]?.message?.reasoning_content === "string"
    ? payload.choices?.[0]?.message?.reasoning_content
    : "";

  return {
    output: {
      text,
      reasoning_content: reasoningContent,
      usage: payload.usage ?? {},
      finish_reason: finishReason,
      model,
      model_profile: modelConfig.id,
      tools: resolvedTools.map((tool) => tool.id),
      tool_calls: toolCallsTrace,
      maximum_iterations: maximumIterations,
    },
    detail: `model=${modelConfig.id}, tools=${resolvedTools.length}`,
    traceInput: {},
    traceProcessData: {
      model_mode: "agent",
      prompts: messages
        .filter((message) => message.role === "system" || message.role === "user" || message.role === "assistant")
        .map((message) => ({
          files: message.role === "user" ? context.input.files : [],
          role: message.role,
          text: message.content ?? "",
          tool_calls: message.tool_calls ?? [],
        })),
      tools: resolvedTools.map((tool) => ({
        id: tool.id,
        name: tool.tool.name,
        server: tool.server.server_identifier,
        function_name: tool.functionName,
      })),
      tool_calls: toolCallsTrace,
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
      tool_calls: toolCallsTrace,
    },
  };
}
