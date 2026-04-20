import type { Edge, Node } from "reactflow";
import type { WorkflowDataType } from "@/app/components/workflow/types";

export type WorkflowFile = {
  name: string;
  type: string;
  size: number;
  text?: string;
};

export type WorkflowTraceItem = {
  nodeId: string;
  nodeType: string;
  status: "pending" | "running" | "completed" | "error";
  detail?: string;
  node: Node;
};

export type WorkflowRunInput = {
  query: string;
  files: WorkflowFile[];
};

export type WorkflowRunResult = {
  output: string;
  outputs: Record<string, unknown>;
  trace: WorkflowTraceItem[];
};

export type NodeOutputMap = Record<string, Record<string, unknown>>;

export type NodeExecutionContext = {
  node: Node;
  nodeId: string;
  workflow: WorkflowDataType;
  input: WorkflowRunInput;
  edges: Edge[];
  nodeOutputs: NodeOutputMap;
  aliasMap: Map<string, string>;
};

export type NodeExecutionResult = {
  output: Record<string, unknown>;
  detail?: string;
  finalOutput?: string;
  finalOutputs?: Record<string, unknown>;
  selectedSourceHandles?: string[];
};
