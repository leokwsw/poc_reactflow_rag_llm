import type { Node } from "reactflow";
import type { CustomNodeType } from "@/app/components/workflow/nodes/types";

export function createNodeData(type: CustomNodeType): Record<string, unknown> {
  let data: Record<string, unknown> = { type };

  if (type === "start") {
    data = {
      ...data,
      label: "Start",
      variables: [
        { name: "query", required: true, type: "string" },
        { name: "files", type: "file[]" },
      ],
    };
  } else if (type === "answer") {
    data = { ...data, label: "Answer", answer: "{{#llm.text#}}" };
  } else if (type === "agent") {
    data = {
      ...data,
      label: "Agent",
      role: "General-purpose assistant",
      apiBaseUrl: "https://api.openai.com/v1",
      apiKey: "",
      model: "gpt-4o-mini",
      instruction: "You are a helpful AI agent. Think step by step and answer with the most useful result.",
      query: "{{#sys.query#}}",
      maximumIterations: 3,
      tools: ["web_search", "calculator"],
    };
  } else if (type === "assigner") {
    data = { ...data, label: "Assigner", assignments: [{ target: "summary", value: "{{#sys.query#}}" }] };
  } else if (type === "code") {
    data = { ...data, label: "Code", language: "JavaScript", code: "return { result: input };" };
  } else if (type === "dataSource") {
    data = { ...data, label: "Data Source", sourceType: "File Upload", variableName: "source_data" };
  } else if (type === "dataSourceEmpty") {
    data = { ...data, label: "Data Source Empty", message: "Waiting for data source selection" };
  } else if (type === "documentExtractor") {
    data = { ...data, label: "Document Extractor", variable_selector: ["start", "files"], is_array_file: true, mode: "text" };
  } else if (type === "humanInput") {
    data = {
      ...data,
      label: "Human Input",
      prompt: "Please provide input",
      variableName: "human_input",
      required_variables: ["start.query"],
      default_value_dict: {},
      selectedBranch: "source",
    };
  } else if (type === "http") {
    data = { ...data, label: "HTTP", method: "GET", url: "https://api.example.com" };
  } else if (type === "iteration") {
    data = { ...data, label: "Iteration", iterator: "items", itemName: "item" };
  } else if (type === "iterationStart") {
    data = { ...data, label: "Iteration Start", scopeName: "iteration_scope" };
  } else if (type === "knowledgeIndex") {
    data = { ...data, label: "Knowledge Index", indexingTechnique: "high_quality", retrievalSearchMethod: "semantic_search" };
  } else if (type === "listOperator") {
    data = { ...data, label: "List Operator", operation: "map", targetList: "items" };
  } else if (type === "llm") {
    data = {
      ...data,
      label: "LLM",
      apiBaseUrl: "https://api.openai.com/v1",
      apiKey: "",
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: "{{#sys.query#}}\n\n{{#sys.files#}}",
        },
      ],
      context: {
        enabled: true,
        variable_selector: ["sys", "query"],
      },
      vision_enable: false,
    };
  } else if (type === "end") {
    data = { ...data, label: "End", outputs: ["2.text"] };
  } else if (type === "ifElse") {
    data = {
      ...data,
      label: "If / Else",
      cases: [
        { id: "if", label: "IF", conditions: ["query contains 'help'"] },
        { id: "elif-1", label: "ELIF", conditions: ["files count > 0"] },
      ],
    };
  } else if (type === "loop") {
    data = { ...data, label: "Loop", condition: "count < 10", maxIterations: 10 };
  } else if (type === "loopEnd") {
    data = { ...data, label: "Loop End", aggregate: "collect_results" };
  } else if (type === "loopStart") {
    data = { ...data, label: "Loop Start", scopeName: "loop_scope" };
  } else if (type === "note") {
    data = { ...data, text: "New note", author: "You", theme: "yellow" };
  } else if (type === "parameterExtractor") {
    data = { ...data, label: "Parameter Extractor", parameters: [{ name: "product", type: "string" }] };
  } else if (type === "questionClassifier") {
    data = {
      ...data,
      label: "Question Classifier",
      apiBaseUrl: "https://api.openai.com/v1",
      apiKey: "",
      model: "gpt-4o-mini",
      instruction: "Classify the query into exactly one class and return the class id only.",
      classes: [{ id: "sales", name: "Sales" }, { id: "support", name: "Support" }],
    };
  } else if (type === "simple") {
    data = { ...data, label: "Simple Node", description: "Simple node content" };
  } else if (type === "templateTransform") {
    data = { ...data, label: "Template Transform", template: "Hello {{#sys.query#}}" };
  } else if (type === "tool") {
    data = { ...data, label: "Tool", toolName: "web_search", outputSchema: ["title", "url", "snippet"] };
  } else if (type === "triggerSchedule") {
    data = {
      ...data,
      label: "Trigger Schedule",
      mode: "visual",
      frequency: "daily",
      visual_config: {
        time: "12:00 AM",
        on_minute: 0,
        weekdays: ["sun"],
        monthly_days: [1],
      },
      timezone: "UTC",
      cron_expression: "0 0 * * *",
    };
  } else if (type === "triggerWebhook") {
    data = {
      ...data,
      label: "Trigger Webhook",
      webhook_url: "",
      method: "POST",
      content_type: "application/json",
      headers: [],
      params: [],
      body: [],
      async_mode: true,
      status_code: 200,
      response_body: "",
      variables: [{ name: "_webhook_raw", type: "object" }],
    };
  } else if (type === "variableAggregator") {
    data = {
      ...data,
      label: "Variable Aggregator",
      output_type: "string",
      variables: [["start", "query"]],
      advanced_settings: {
        group_enabled: false,
        groups: [],
      },
    };
  } else if (type === "variableAssigner") {
    data = { ...data, label: "Variable Assigner", variables: [{ name: "result", expression: "{{#sys.query#}}" }] };
  } else if (type === "knowledgeBase") {
    data = { ...data, label: "Knowledge Base", indexingTechnique: "high_quality", retrievalSearchMethod: "semantic_search" };
  } else {
    data = {
      ...data,
      label: "Knowledge Retrieval",
      datasets: [
        { id: "kb-1", name: "Product Docs" },
        { id: "kb-2", name: "Support FAQ" },
      ],
    };
  }

  return data;
}

export function createNodeAtPosition(type: CustomNodeType, position: { x: number; y: number }): Node {
  return {
    id: crypto.randomUUID(),
    type: "custom",
    position,
    data: createNodeData(type),
  };
}
