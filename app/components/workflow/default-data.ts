import sampleGraph from "@/data/graph.json";
import { WorkflowDataType } from "@/app/components/workflow/types";
import { isCustomNodeType } from "@/app/components/workflow/nodes/allowed";
import { DEFAULT_MODEL_PROFILE_ID, isModelProfileId } from "@/app/model/profiles";

type GraphNode = {
  id: string;
  type?: string;
  position?: { x?: number; y?: number };
  width?: number;
  height?: number;
  positionAbsolute?: { x: number; y: number };
  dragging?: boolean;
  data?: {
    type?: string;
    label?: string;
    title?: string;
    runStatus?: "idle" | "running" | "completed" | "error";
    answer?: string;
    outputs?: string[];
    template?: string;
    output_type?: string;
    variable_selector?: string[];
    is_array_file?: boolean;
    mode?: string;
    frequency?: string;
    timezone?: string;
    cron_expression?: string;
    visual_config?: {
      time?: string;
      on_minute?: number;
      weekdays?: string[];
      monthly_days?: Array<number | "last">;
    };
    webhook_url?: string;
    method?: string;
    content_type?: string;
    headers?: Array<{ name?: string; value?: string }>;
    params?: Array<{ name?: string; type?: string }>;
    body?: Array<{ name?: string; type?: string }>;
    async_mode?: boolean;
    status_code?: number;
    response_body?: string;
    required_variables?: string[];
    default_value_dict?: Record<string, unknown>;
    variables?: Array<{ name?: string; required?: boolean; type?: string } | string[]>;
    items?: Array<{
      variable_selector?: string[];
      value?: string[] | string;
    }>;
    classes?: Array<{ id: string; name: string }>;
    instructions?: string;
    apiBaseUrl?: string;
    apiKey?: string;
    model?: string;
    prompt_template?: Array<{
      role?: string;
      text?: string;
      id?: string;
      edition_type?: string;
    }> | string;
    messages?: Array<{
      role?: string;
      content?: string;
    }>;
    context?: {
      enabled?: boolean;
      variable_selector?: string[];
    };
    vision?: {
      enabled?: boolean;
    };
    query_variable_selector?: string[];
    cases?: Array<{
      id?: string;
      case_id?: string;
      conditions?: Array<{
        comparison_operator?: string;
        variable_selector?: string[];
        value?: string;
      }>;
    }>;
    agent_parameters?: {
      instruction?: { value?: string };
      query?: { value?: string };
      model?: { value?: { model?: string } };
      tools?: { value?: Array<{ tool_name?: string }> };
      maximum_iterations?: { value?: number };
    };
  };
};

type GraphEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  style?: {
    strokeDasharray?: string;
    opacity?: number;
    strokeWidth?: number;
  };
  [key: string]: unknown;
};

type IfElseCondition = {
  comparison_operator?: string;
  variable_selector?: string[];
  value?: string;
};

type GraphPayload = {
  graph?: {
    nodes?: GraphNode[];
    edges?: GraphEdge[];
    readOnly?: boolean;
    viewport?: {
      x?: number;
      y?: number;
      zoom?: number;
    };
  };
};

const rawGraph = sampleGraph as GraphPayload;

function mapNodeType(type?: string) {
  switch (type) {
    case "if-else":
      return "ifElse";
    case "question-classifier":
      return "questionClassifier";
    case "knowledge-retrieval":
      return "knowledgeRetrieval";
    default:
      return isCustomNodeType(type) ? type : undefined;
  }
}

function extractOutputsFromAnswer(answer?: string) {
  if (!answer)
    return [];

  return Array.from(answer.matchAll(/\{\{#([^#.]+)\.([^#]+)#\}\}/g))
    .map((match) => `${match[1]}.${match[2]}`);
}

function normalizeIfElseCondition(condition: IfElseCondition) {
  const selector = condition.variable_selector?.join(".") ?? "value";
  const rawValue = condition.value ?? "";

  switch (condition.comparison_operator) {
    case "empty":
      return `${selector} == ''`;
    case "not empty":
      return `${selector} != ''`;
    case "contains":
      return `${selector} contains '${rawValue}'`;
    case "not contains":
      return `${selector} not contains '${rawValue}'`;
    case "equal":
      return `${selector} == '${rawValue}'`;
    case "not equal":
      return `${selector} != '${rawValue}'`;
    default:
      return [selector, condition.comparison_operator, rawValue].filter(Boolean).join(" ");
  }
}

function normalizeLlmMessages(messages: Array<{ role?: string; content?: string }>) {
  const safeMessages = messages.filter((item) => typeof item.content === "string");
  const systemMessage = safeMessages.find((item) => item.role === "system") ?? {
    role: "system",
    content: "You are a helpful assistant.",
  };
  const otherMessages = safeMessages
    .filter((item) => item !== systemMessage)
    .map((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: item.content ?? "",
    }));

  return [
    {
      role: "system",
      content: systemMessage.content ?? "You are a helpful assistant.",
    },
    ...otherMessages,
  ];
}

function normalizeModelProfile(value: unknown) {
  return isModelProfileId(value) ? value : DEFAULT_MODEL_PROFILE_ID;
}

function buildNodeData(node: GraphNode) {
  const data = node.data ?? {};
  const nodeType = mapNodeType(data.type);
  if (!nodeType) {
    return null;
  }

  const label = data.label ?? data.title ?? nodeType;

  if (nodeType === "start") {
    return {
      ...data,
      type: nodeType,
      label,
      variables: [
        { name: "query", required: true, type: "string" },
        { name: "files", type: "file[]" },
      ],
    };
  }

  if (nodeType === "end") {
    return {
      type: nodeType,
      label,
      answer: data.answer ?? "",
      outputs: extractOutputsFromAnswer(data.answer),
    };
  }

  if (nodeType === "questionClassifier") {
    return {
      type: nodeType,
      label,
      model: normalizeModelProfile(data.model),
      instruction: data.instructions ?? "",
      classes: (data.classes ?? []).map((classItem) => ({
        id: classItem.id,
        title: classItem.name,
        value: classItem.name,
      })),
      queryVariableSelector: data.query_variable_selector ?? [],
    };
  }

  if (nodeType === "llm") {
    const rawPromptTemplate = (data as Record<string, unknown>).prompt_template;
    const rawPromptTemplateText = typeof rawPromptTemplate === "string"
      ? rawPromptTemplate
      : Array.isArray(rawPromptTemplate)
        ? String((rawPromptTemplate.find((item) => item.role !== "system")?.text) ?? "")
        : "";
    const rawMemoryQueryPrompt = typeof (data as Record<string, unknown>).memory === "object" && (data as Record<string, unknown>).memory
      ? String((((data as Record<string, unknown>).memory as Record<string, unknown>).query_prompt_template) ?? "")
      : "";
    const rawSystemPrompt = Array.isArray(rawPromptTemplate)
      ? String((rawPromptTemplate.find((item) => item.role === "system")?.text) ?? "")
      : "";
    const rawMessages = Array.isArray(data.messages)
      ? data.messages
          .map((item) => ({
            role: item.role === "assistant" || item.role === "user" || item.role === "system" ? item.role : "user",
            content: String(item.content ?? ""),
          }))
          .filter((item) => item.content.trim() || item.role === "system")
      : [];
    const fallbackMessages = [
      {
        role: "system",
        content: rawSystemPrompt || String((data as Record<string, unknown>).systemPrompt ?? "") || "You are a helpful assistant.",
      },
      {
        role: "user",
        content: rawMemoryQueryPrompt || rawPromptTemplateText || "{{#sys.query#}}\n\n{{#sys.files#}}",
      },
    ];

    return {
      type: nodeType,
      label,
      model: normalizeModelProfile(data.model),
      messages: normalizeLlmMessages(rawMessages.length > 0 ? rawMessages : fallbackMessages),
      context_variable: Array.isArray(data.context?.variable_selector)
        ? data.context?.variable_selector.join(".")
        : String((data as Record<string, unknown>).context_variable ?? ""),
      vision_enable: Boolean(data.vision?.enabled ?? (data as Record<string, unknown>).vision_enable ?? false),
    };
  }

  if (nodeType === "ifElse") {
    return {
      type: nodeType,
      label,
      cases: (data.cases ?? []).map((caseItem) => ({
        id: caseItem.id ?? caseItem.case_id ?? `case-${Date.now()}`,
        label: caseItem.case_id?.toUpperCase() ?? caseItem.id ?? "CASE",
        conditions: (caseItem.conditions ?? []).map(normalizeIfElseCondition),
      })),
    };
  }

  if (nodeType === "agent") {
    const instruction = data.agent_parameters?.instruction?.value ?? "";
    const firstLine = instruction.split("\n").find((line) => line.trim()) ?? "General-purpose assistant";

    return {
      type: nodeType,
      label,
      role: firstLine,
      instruction,
      query: data.agent_parameters?.query?.value ?? "",
      model: normalizeModelProfile(data.agent_parameters?.model?.value?.model ?? data.model),
      maximumIterations: data.agent_parameters?.maximum_iterations?.value ?? 3,
      tools: data.agent_parameters?.tools?.value?.map((tool) => tool.tool_name ?? "").filter(Boolean) ?? [],
    };
  }

  return {
    ...data,
    type: nodeType,
    label,
  };
}

function buildDefaultData(): WorkflowDataType {
  const graph = rawGraph.graph ?? {};
  const nodes = (graph.nodes ?? []).flatMap((node) => {
    const data = buildNodeData(node);
    if (!data) return [];

    return [{
      ...node,
      id: node.id,
      type: "custom",
      position: {
        x: node.position?.x ?? 0,
        y: node.position?.y ?? 0,
      },
      data,
    }];
  });
  const nodeIds = new Set(nodes.map((node) => node.id));

  const edges = (graph.edges ?? [])
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge) => ({
      ...edge,
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle === "false" ? "else" : edge.sourceHandle,
      targetHandle: edge.targetHandle,
      style: {
        ...edge.style,
        opacity: edge.style?.opacity ?? 1,
        strokeWidth: edge.style?.strokeWidth ?? 2,
      },
    }));

  return {
    nodes,
    edges,
    readOnly: graph.readOnly ?? false,
    viewport: {
      x: graph.viewport?.x ?? 0,
      y: graph.viewport?.y ?? 0,
      zoom: graph.viewport?.zoom ?? 1,
    },
  };
}

export const defaultData: WorkflowDataType = buildDefaultData();
