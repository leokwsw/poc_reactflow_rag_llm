import {defaultData} from "@/app/components/workflow/default-data";
import type {WorkflowDataType} from "@/app/components/workflow/types";

export type WorkflowTemplate = {
  id: string;
  title: string;
  description: string;
  category: string;
  graph: WorkflowDataType;
};

const cloneGraph = (graph: WorkflowDataType) => JSON.parse(JSON.stringify(graph)) as WorkflowDataType;

export const workflowTemplates: WorkflowTemplate[] = [
  {
    id: "basic-rag-qa",
    title: "RAG Q&A",
    description: "A starter workflow for asking questions, retrieving knowledge, and returning a final answer.",
    category: "RAG",
    graph: cloneGraph(defaultData),
  },
  {
    id: "classifier-router",
    title: "Question Classifier Router",
    description: "Use a classifier node to route incoming questions into separate branches.",
    category: "Routing",
    graph: cloneGraph(defaultData),
  },
  {
    id: "agent-tool-runner",
    title: "Agent With Tools",
    description: "Start from the default graph and adapt it for agent nodes, MCP tools, and HTTP tools.",
    category: "Agent",
    graph: cloneGraph(defaultData),
  },
  {
    id: "http-enrichment",
    title: "HTTP Enrichment",
    description: "A workflow skeleton for calling an HTTP API before producing the final answer.",
    category: "Integration",
    graph: cloneGraph(defaultData),
  },
];

export const getWorkflowTemplate = (templateId: string) =>
  workflowTemplates.find((template) => template.id === templateId);
