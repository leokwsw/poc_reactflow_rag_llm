import {WorkflowDataType} from "@/app/components/workflow/types";

export const defaultData: WorkflowDataType = {
  nodes: [
    {
      id: "1",
      type: "custom",
      position: {x: 100, y: 120},
      data: {
        type: "start",
        label: "Start",
        variables: [
          {name: "query", required: true, type: "string"},
          {name: "files", type: "file[]"},
        ],
      },
    },
    {
      id: "2",
      type: "custom",
      position: {x: 380, y: 120},
      data: {
        type: "llm",
        label: "LLM",
        provider: "openai",
        apiBaseUrl: "https://api.openai.com/v1",
        apiKey: "",
        model: "gpt-4o-mini",
        systemPrompt: "You are a helpful assistant.",
      },
    },
    {
      id: "3",
      type: "custom",
      position: {x: 680, y: 120},
      data: {type: "end", label: "End", outputs: ["2.text", "2.usage.total_tokens"]},
    },
  ],
  edges: [
    {
      id: "e1-2",
      source: "1",
      target: "2",
      style: {
        strokeDasharray: undefined,
        opacity: 1,
        strokeWidth: 2,
      },
    },
    {
      id: "e2-3",
      source: "2",
      target: "3",
      style: {
        strokeDasharray: undefined,
        opacity: 1,
        strokeWidth: 2,
      },
    },
  ],
  readOnly: false,
  viewport: {
    x: 219,
    y: 574,
    zoom: 0.7
  }
}
