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
    title: "RAG 問答",
    description: "用作知識庫問答的起始工作流：接收問題、檢索相關知識，最後輸出答案。",
    category: "RAG",
    graph: cloneGraph(defaultData),
  },
  {
    id: "classifier-router",
    title: "問題分類路由",
    description: "使用問題分類節點判斷輸入類型，將問題導向不同處理分支。",
    category: "路由",
    graph: cloneGraph(defaultData),
  },
  {
    id: "agent-tool-runner",
    title: "工具型 Agent",
    description: "以預設圖為基礎，配合 Agent 節點、MCP 工具及 HTTP 工具完成多步任務。",
    category: "Agent",
    graph: cloneGraph(defaultData),
  },
  {
    id: "http-enrichment",
    title: "HTTP 資料補充",
    description: "在產生最終答案前先呼叫外部 HTTP API，將取得的資料加入工作流。",
    category: "整合",
    graph: cloneGraph(defaultData),
  },
];

export const getWorkflowTemplate = (templateId: string) =>
  workflowTemplates.find((template) => template.id === templateId);
