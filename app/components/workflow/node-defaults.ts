import type { Node } from "reactflow";
import type { CustomNodeType } from "@/app/components/workflow/nodes/types";
import { DEFAULT_MODEL_PROFILE_ID } from "@/app/model/profiles";

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
  } else if (type === "agent") {
    data = {
      ...data,
      label: "Agent",
      model: DEFAULT_MODEL_PROFILE_ID,
      messages: [
        {
          role: "system",
          content: "You are a helpful AI agent. Use tools when they can improve the answer.",
        },
        {
          role: "user",
          content: "{{#sys.query#}}\n\n{{#sys.files#}}",
        },
      ],
      context_variable: "",
      vision_enable: false,
      maximumIterations: 3,
      tools: [],
    };
  } else if (type === "http") {
    data = { ...data, label: "HTTP", method: "GET", url: "https://api.example.com" };
  } else if (type === "llm") {
    data = {
      ...data,
      label: "LLM",
      model: DEFAULT_MODEL_PROFILE_ID,
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
      context_variable: "",
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
  } else if (type === "questionClassifier") {
    data = {
      ...data,
      label: "Question Classifier",
      model: DEFAULT_MODEL_PROFILE_ID,
      instruction: "Classify the query into exactly one class and return the class id only.",
      classes: [{ id: "sales", title: "Sales", value: "Sales" }, { id: "support", title: "Support", value: "Support" }],
    };
  } else if (type === "knowledgeRetrieval") {
    data = {
      ...data,
      label: "Knowledge Retrieval",
      query: "{{#sys.query#}}",
      datasets: [],
    };
  } else {
    data = {...data, label: "Node", description: ""};
  }

  return data;
}

export function createNodeAtPosition(type: CustomNodeType, position: { x: number; y: number }): Node {
  return {
    id: crypto.randomUUID(),
    type: "custom",
    position,
    deletable: type !== "start",
    data: createNodeData(type),
  };
}
