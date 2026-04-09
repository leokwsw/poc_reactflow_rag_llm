import type {Edge, Node} from "reactflow";

export const defaultInitialNodes: Node[] = [
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
    data: {type: "llm", label: "LLM", provider: "openai", model: "gpt-4o-mini"},
  },
  {
    id: "3",
    type: "custom",
    position: {x: 680, y: 120},
    data: {type: "end", label: "End", outputs: ["2.text", "2.usage.total_tokens"]},
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
