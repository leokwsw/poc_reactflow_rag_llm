import sampleGraph from "@/sample-graph.json";
import { WorkflowDataType } from "@/app/components/workflow/types";

type DifyGraphNode = {
  id: string;
  type?: string;
  position?: { x?: number; y?: number };
  data?: {
    type?: string;
    title?: string;
    answer?: string;
    template?: string;
    variables?: Array<{ name?: string; required?: boolean; type?: string } | string[]>;
    items?: Array<{
      variable_selector?: string[];
      value?: string[] | string;
    }>;
    classes?: Array<{ id: string; name: string }>;
    instructions?: string;
    model?: {
      name?: string;
      model?: string;
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
    };
  };
};

type DifyGraphEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
};

type DifyIfElseCondition = {
  comparison_operator?: string;
  variable_selector?: string[];
  value?: string;
};

type DifyGraphPayload = {
  graph?: {
    nodes?: DifyGraphNode[];
    edges?: DifyGraphEdge[];
    viewport?: {
      x?: number;
      y?: number;
      zoom?: number;
    };
  };
};

const rawGraph = sampleGraph as DifyGraphPayload;

function mapNodeType(type?: string) {
  switch (type) {
    case "answer":
      return "end";
    case "if-else":
      return "ifElse";
    case "question-classifier":
      return "questionClassifier";
    case "template-transform":
      return "templateTransform";
    case "variable-aggregator":
      return "variableAssigner";
    default:
      return type ?? "simple";
  }
}

function normalizeExpression(value: string[] | string | undefined) {
  if (!value)
    return "";

  if (Array.isArray(value)) {
    if (value[0] === "sys" && value[1] === "query")
      return "{{query}}";
    if (value[0] === "sys" && value[1] === "files")
      return "{{files}}";
    if (value.length >= 2)
      return `{{${value[0]}.${value[1]}}}`;
    return value.join(".");
  }

  return value.replace(/\{\{#([^#.]+)\.([^#]+)#\}\}/g, "{{$1.$2}}");
}

function extractOutputsFromAnswer(answer?: string) {
  if (!answer)
    return [];

  return Array.from(answer.matchAll(/\{\{#([^#.]+)\.([^#]+)#\}\}/g))
    .map((match) => `${match[1]}.${match[2]}`);
}

function normalizeIfElseCondition(condition: DifyIfElseCondition) {
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

function buildNodeData(node: DifyGraphNode) {
  const data = node.data ?? {};
  const nodeType = mapNodeType(data.type);
  const label = data.title ?? nodeType;

  if (nodeType === "start") {
    const variables = Array.isArray(data.variables) && data.variables.length > 0
      ? data.variables
      : [
          { name: "query", required: true, type: "string" },
          { name: "files", type: "file[]" },
        ];

    return {
      ...data,
      type: nodeType,
      label,
      variables,
    };
  }

  if (nodeType === "end") {
    return {
      type: nodeType,
      label,
      outputs: extractOutputsFromAnswer(data.answer),
    };
  }

  if (nodeType === "questionClassifier") {
    return {
      type: nodeType,
      label,
      model: data.model?.name ?? data.model?.model ?? "",
      instruction: data.instructions ?? "",
      classes: data.classes ?? [],
      queryVariableSelector: data.query_variable_selector ?? [],
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

  if (nodeType === "templateTransform") {
    return {
      type: nodeType,
      label,
      template: data.template ?? "",
    };
  }

  if (nodeType === "assigner") {
    return {
      type: nodeType,
      label,
      assignments: (data.items ?? []).map((item) => ({
        target: item.variable_selector?.join(".") ?? "",
        value: normalizeExpression(item.value),
      })),
    };
  }

  if (nodeType === "variableAssigner") {
    const variables = Array.isArray(data.variables) ? data.variables : [];
    return {
      type: nodeType,
      label,
      variables: variables.map((item, index) => ({
        name: index === 0 ? "output" : `value_${index + 1}`,
        expression: normalizeExpression(Array.isArray(item) ? item : undefined),
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
      model: data.agent_parameters?.model?.value?.model ?? "",
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
  const nodes = (graph.nodes ?? []).map((node) => ({
    id: node.id,
    type: "custom",
    position: {
      x: node.position?.x ?? 0,
      y: node.position?.y ?? 0,
    },
    data: buildNodeData(node),
  }));

  const edges = (graph.edges ?? []).map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle === "false" ? "else" : edge.sourceHandle,
    targetHandle: edge.targetHandle,
    style: {
      strokeDasharray: undefined,
      opacity: 1,
      strokeWidth: 2,
    },
  }));

  return {
    nodes,
    edges,
    readOnly: false,
    viewport: {
      x: graph.viewport?.x ?? 0,
      y: graph.viewport?.y ?? 0,
      zoom: graph.viewport?.zoom ?? 1,
    },
  };
}

export const defaultData: WorkflowDataType = buildDefaultData();
