import { executeAgentNode } from "@/app/components/workflow/nodes/agent/execution";
import { executeAnswerNode } from "@/app/components/workflow/nodes/answer/execution";
import { executeAssignerNode } from "@/app/components/workflow/nodes/assigner/execution";
import { executeCodeNode } from "@/app/components/workflow/nodes/code/execution";
import { executeDataSourceEmptyNode } from "@/app/components/workflow/nodes/data-source-empty/execution";
import { executeDataSourceNode } from "@/app/components/workflow/nodes/data-source/execution";
import { executeDocumentExtractorNode } from "@/app/components/workflow/nodes/document-extractor/execution";
import { executeEndNode } from "@/app/components/workflow/nodes/end/execution";
import { executeHttpNode } from "@/app/components/workflow/nodes/http/execution";
import { executeHumanInputNode } from "@/app/components/workflow/nodes/human-input/execution";
import { executeIfElseNode } from "@/app/components/workflow/nodes/if-else/execution";
import { executeIterationStartNode } from "@/app/components/workflow/nodes/iteration-start/execution";
import { executeIterationNode } from "@/app/components/workflow/nodes/iteration/execution";
import { executeKnowledgeBaseNode } from "@/app/components/workflow/nodes/knowledge-base/execution";
import { executeKnowledgeIndexNode } from "@/app/components/workflow/nodes/knowledge-index/execution";
import { executeKnowledgeRetrievalNode } from "@/app/components/workflow/nodes/knowledge-retrieval/execution";
import { executeListOperatorNode } from "@/app/components/workflow/nodes/list-operator/execution";
import { executeLlmNode } from "@/app/components/workflow/nodes/llm/execution";
import { executeLoopEndNode } from "@/app/components/workflow/nodes/loop-end/execution";
import { executeLoopStartNode } from "@/app/components/workflow/nodes/loop-start/execution";
import { executeLoopNode } from "@/app/components/workflow/nodes/loop/execution";
import { executeParameterExtractorNode } from "@/app/components/workflow/nodes/parameter-extractor/execution";
import { executeQuestionClassifierNode } from "@/app/components/workflow/nodes/question-classifier/execution";
import { executeSimpleNode } from "@/app/components/workflow/nodes/simple/execution";
import { executeStartNode } from "@/app/components/workflow/nodes/start/execution";
import { executeTemplateTransformNode } from "@/app/components/workflow/nodes/template-transform/execution";
import { executeToolNode } from "@/app/components/workflow/nodes/tool/execution";
import { executeTriggerScheduleNode } from "@/app/components/workflow/nodes/trigger-schedule/execution";
import { executeTriggerWebhookNode } from "@/app/components/workflow/nodes/trigger-webhook/execution";
import { executeVariableAggregatorNode } from "@/app/components/workflow/nodes/variable-aggregator/execution";
import { executeVariableAssignerNode } from "@/app/components/workflow/nodes/variable-assigner/execution";
import type { NodeExecutionContext, NodeExecutionResult } from "@/app/components/workflow/nodes/execution-types";

export type NodeExecutor = (context: NodeExecutionContext) => Promise<NodeExecutionResult>;

export const nodeExecutors: Record<string, NodeExecutor> = {
  start: executeStartNode,
  answer: executeAnswerNode,
  agent: executeAgentNode,
  assigner: executeAssignerNode,
  code: executeCodeNode,
  dataSource: executeDataSourceNode,
  dataSourceEmpty: executeDataSourceEmptyNode,
  documentExtractor: executeDocumentExtractorNode,
  humanInput: executeHumanInputNode,
  http: executeHttpNode,
  ifElse: executeIfElseNode,
  iteration: executeIterationNode,
  iterationStart: executeIterationStartNode,
  knowledgeBase: executeKnowledgeBaseNode,
  knowledgeIndex: executeKnowledgeIndexNode,
  knowledgeRetrieval: executeKnowledgeRetrievalNode,
  listOperator: executeListOperatorNode,
  questionClassifier: executeQuestionClassifierNode,
  llm: executeLlmNode,
  loop: executeLoopNode,
  loopEnd: executeLoopEndNode,
  loopStart: executeLoopStartNode,
  parameterExtractor: executeParameterExtractorNode,
  templateTransform: executeTemplateTransformNode,
  tool: executeToolNode,
  triggerSchedule: executeTriggerScheduleNode,
  triggerWebhook: executeTriggerWebhookNode,
  variableAggregator: executeVariableAggregatorNode,
  variableAssigner: executeVariableAssignerNode,
  simple: executeSimpleNode,
  end: executeEndNode,
};
