import type { Node } from "reactflow";
import type { CustomNodeType } from "@/app/components/workflow/nodes/types";

export function createNodeData(type: CustomNodeType): Record<string, unknown> {
  let data: Record<string, unknown> = { type };

  if (type === "start") {
    data = { ...data, label: "Start", variables: [{ name: "query", required: true, type: "string" }] };
  } else if (type === "agent") {
    data = { ...data, label: "Agent", role: "General-purpose assistant", tools: ["web_search", "calculator"] };
  } else if (type === "assigner") {
    data = { ...data, label: "Assigner", assignments: [{ target: "summary", value: "{{query}}" }] };
  } else if (type === "code") {
    data = { ...data, label: "Code", language: "JavaScript", code: "return { result: input };" };
  } else if (type === "dataSource") {
    data = { ...data, label: "Data Source", sourceType: "File Upload", variableName: "source_data" };
  } else if (type === "dataSourceEmpty") {
    data = { ...data, label: "Data Source Empty", message: "Waiting for data source selection" };
  } else if (type === "http") {
    data = { ...data, label: "HTTP", method: "GET", url: "https://api.example.com" };
  } else if (type === "iteration") {
    data = { ...data, label: "Iteration", iterator: "items", itemName: "item" };
  } else if (type === "iterationStart") {
    data = { ...data, label: "Iteration Start", scopeName: "iteration_scope" };
  } else if (type === "listOperator") {
    data = { ...data, label: "List Operator", operation: "map", targetList: "items" };
  } else if (type === "llm") {
    data = {
      ...data,
      label: "LLM",
      provider: "openai",
      apiBaseUrl: "https://api.openai.com/v1",
      apiKey: "",
      model: "gpt-4o-mini",
      systemPrompt: "You are a helpful assistant.",
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
    data = { ...data, label: "Template Transform", template: "Hello {{query}}" };
  } else if (type === "tool") {
    data = { ...data, label: "Tool", toolName: "web_search", outputSchema: ["title", "url", "snippet"] };
  } else if (type === "variableAssigner") {
    data = { ...data, label: "Variable Assigner", variables: [{ name: "result", expression: "{{query}}" }] };
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
