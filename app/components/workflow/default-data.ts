import type { Edge, Node } from "reactflow";

export const defaultInitialNodes: Node[] = [
  {
    id: "1",
    type: "start",
    position: { x: 100, y: 120 },
    data: {
      label: "Start",
      variables: [
        { name: "query", required: true, type: "string" },
        { name: "files", type: "file[]" },
      ],
    },
  },
  {
    id: "2",
    type: "llm",
    position: { x: 380, y: 120 },
    data: { label: "LLM", provider: "openai", model: "gpt-4o-mini" },
  },
  {
    id: "3",
    type: "end",
    position: { x: 680, y: 120 },
    data: { label: "End", outputs: ["2.text", "2.usage.total_tokens"] },
  },
];

export const defaultInitialEdges: Edge[] = [
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
];
