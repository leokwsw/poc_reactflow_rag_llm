import { executeAgentNode } from "@/app/components/workflow/nodes/agent/execution";
import { executeEndNode } from "@/app/components/workflow/nodes/end/execution";
import { executeHttpNode } from "@/app/components/workflow/nodes/http/execution";
import { executeIfElseNode } from "@/app/components/workflow/nodes/if-else/execution";
import { executeKnowledgeRetrievalNode } from "@/app/components/workflow/nodes/knowledge-retrieval/execution";
import { executeLlmNode } from "@/app/components/workflow/nodes/llm/execution";
import { executeNoteNode } from "@/app/components/workflow/nodes/note/execution";
import { executeQuestionClassifierNode } from "@/app/components/workflow/nodes/question-classifier/execution";
import { executeStartNode } from "@/app/components/workflow/nodes/start/execution";
import { executeToolNode } from "@/app/components/workflow/nodes/tool/execution";
import type { CustomNodeType } from "@/app/components/workflow/nodes/allowed";
import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";

export type NodeExecutor = (context: NodeExecutionContext) => Promise<NodeExecutionResult>;

export const nodeExecutors: Record<CustomNodeType, NodeExecutor> = {
  start: executeStartNode,
  end: executeEndNode,
  llm: executeLlmNode,
  agent: executeAgentNode,
  tool: executeToolNode,
  http: executeHttpNode,
  ifElse: executeIfElseNode,
  knowledgeRetrieval: executeKnowledgeRetrievalNode,
  questionClassifier: executeQuestionClassifierNode,
  note: executeNoteNode,
};
