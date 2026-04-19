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
        type: "ifElse",
        label: "If / Else",
        cases: [
          {id: "if", label: "Help Request", conditions: ["query contains 'help'"]},
        ],
      },
    },
    {
      id: "3",
      type: "custom",
      position: {x: 700, y: 40},
      data: {
        type: "llm",
        label: "Help LLM",
        provider: "openai",
        apiBaseUrl: "https://port8900.octopus-tech.com/v1",
        apiKey: "abc1234",
        model: "qwen/qwen3-14b",
        systemPrompt: "You are a support assistant. Answer help-related questions clearly and actionably.",
      },
    },
    {
      id: "4",
      type: "custom",
      position: {x: 700, y: 240},
      data: {
        type: "llm",
        label: "General LLM",
        provider: "openai",
        apiBaseUrl: "https://port8900.octopus-tech.com/v1",
        apiKey: "abc1234",
        model: "qwen/qwen3-14b",
        systemPrompt: "You are a helpful general assistant.",
      },
    },
    {
      id: "5",
      type: "custom",
      position: {x: 1020, y: 40},
      data: {type: "end", label: "Help End", outputs: ["3.text", "3.usage.total_tokens"]},
    },
    {
      id: "6",
      type: "custom",
      position: {x: 1020, y: 240},
      data: {type: "end", label: "General End", outputs: ["4.text", "4.usage.total_tokens"]},
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
      id: "e2-3-if",
      source: "2",
      sourceHandle: "if",
      target: "3",
      style: {
        strokeDasharray: undefined,
        opacity: 1,
        strokeWidth: 2,
      },
    },
    {
      id: "e2-4-else",
      source: "2",
      sourceHandle: "else",
      target: "4",
      style: {
        strokeDasharray: undefined,
        opacity: 1,
        strokeWidth: 2,
      },
    },
    {
      id: "e3-5",
      source: "3",
      target: "5",
      style: {
        strokeDasharray: undefined,
        opacity: 1,
        strokeWidth: 2,
      },
    },
    {
      id: "e4-6",
      source: "4",
      target: "6",
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
