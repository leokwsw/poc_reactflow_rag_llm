import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";
import { getIncomingEdges, summarizeFiles } from "@/app/components/workflow/nodes/execution-utils";
import { getPrimaryParentOutput, interpolateTemplate } from "@/app/components/workflow/nodes/_base/execution-helpers";

type AgentNodeData = {
  apiBaseUrl?: string;
  apiKey?: string;
  model?: string;
  role?: string;
  instruction?: string;
  query?: string;
  maximumIterations?: number;
  tools?: Array<string | { tool_name?: string; name?: string }>;
  agent_parameters?: {
    instruction?: { value?: string };
    query?: { value?: string };
    model?: { value?: { model?: string } };
    tools?: { value?: Array<{ tool_name?: string; name?: string }> };
    maximum_iterations?: { value?: number };
  };
};

function getAgentInstruction(data: AgentNodeData) {
  return data.instruction?.trim()
    || data.agent_parameters?.instruction?.value?.trim()
    || data.role?.trim()
    || "You are a helpful AI agent.";
}

function getAgentQuery(data: AgentNodeData, context: NodeExecutionContext, parentText: string) {
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

function getAgentTools(data: AgentNodeData) {
  const rawTools = data.tools ?? data.agent_parameters?.tools?.value ?? [];
  return rawTools
    .map((tool) => (typeof tool === "string" ? tool : tool.tool_name || tool.name || ""))
    .filter(Boolean);
}

export async function executeAgentNode(context: NodeExecutionContext): Promise<NodeExecutionResult> {
  const data = (context.node.data ?? {}) as AgentNodeData;
  const parentOutput = getPrimaryParentOutput(context);
  const incomingEdges = getIncomingEdges(context.node.id, context.edges);
  const firstParent = incomingEdges[0]?.source;
  const parentText =
    typeof parentOutput?.text === "string"
      ? parentOutput.text
      : typeof parentOutput?.query === "string"
        ? parentOutput.query
        : firstParent
          ? String(context.nodeOutputs[firstParent]?.text ?? context.nodeOutputs[firstParent]?.query ?? "")
          : "";
  const instruction = getAgentInstruction(data);
  const query = getAgentQuery(data, context, parentText);
  const tools = getAgentTools(data);
  const apiBaseUrl = (data.apiBaseUrl || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const apiKey = data.apiKey || process.env.OPENAI_API_KEY;
  const model = data.model || data.agent_parameters?.model?.value?.model || process.env.OPENAI_MODEL;
  const maximumIterations = data.maximumIterations
    ?? data.agent_parameters?.maximum_iterations?.value
    ?? 3;

  if (!apiKey) {
    throw new Error(`Agent node "${context.node.id}" is missing apiKey, and OPENAI_API_KEY is not set.`);
  }
  if (!model) {
    throw new Error(`Agent node "${context.node.id}" is missing model.`);
  }

  const fileSummary = summarizeFiles(context.input.files);
  const userContent = [
    query,
    fileSummary ? `Attached files:\n${fileSummary}` : "",
    tools.length > 0 ? `Available tools:\n${tools.map((tool) => `- ${tool}`).join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await fetch(`${apiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        {
          role: "system",
          content: [
            instruction,
            tools.length > 0 ? `You may reason with these available tools, but respond with the best direct answer using the provided context: ${tools.join(", ")}.` : "",
            `Keep the answer useful and concise. Maximum iterations hint: ${maximumIterations}.`,
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
        {
          role: "user",
          content: userContent,
        },
      ],
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
    throw new Error(payload.error?.message || `Agent request failed with status ${response.status}.`);
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
      role: data.role || "General-purpose assistant",
      instruction,
      query,
      tools,
      maximum_iterations: maximumIterations,
      input: parentOutput ?? { query: context.input.query },
      text,
      usage: payload.usage ?? {},
      model,
    },
    detail: `model=${model}, tools=${tools.length}`,
  };
}
