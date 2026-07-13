import {createNodeData} from "@/app/components/workflow/node-defaults";
import type {WorkflowDataType} from "@/app/components/workflow/types";

export const defaultData: WorkflowDataType = {
  nodes: [
    {
      id: "sys",
      type: "custom",
      position: {x: 80, y: 220},
      data: createNodeData("start"),
    },
    {
      id: "llm",
      type: "custom",
      position: {x: 420, y: 180},
      data: createNodeData("llm"),
    },
    {
      id: "end",
      type: "custom",
      position: {x: 760, y: 220},
      data: {
        ...createNodeData("end"),
        outputs: ["llm.text"],
      },
    },
  ],
  edges: [
    {
      id: "edge-sys-llm",
      source: "sys",
      target: "llm",
      type: "custom",
      style: {
        opacity: 1,
        strokeWidth: 2,
      },
    },
    {
      id: "edge-llm-end",
      source: "llm",
      target: "end",
      type: "custom",
      style: {
        opacity: 1,
        strokeWidth: 2,
      },
    },
  ],
  readOnly: false,
  viewport: {
    x: 0,
    y: 0,
    zoom: 1,
  },
};
