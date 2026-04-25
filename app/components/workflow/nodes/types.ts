import AgentNode from "@/app/components/workflow/nodes/agent/ui";
import AnswerNode from "@/app/components/workflow/nodes/answer/ui";
import AssignerNode from "@/app/components/workflow/nodes/assigner/ui";
import CodeNode from "@/app/components/workflow/nodes/code/ui";
import DataSourceEmptyNode from "@/app/components/workflow/nodes/data-source-empty/ui";
import DataSourceNode from "@/app/components/workflow/nodes/data-source/ui";
import DocumentExtractorNode from "@/app/components/workflow/nodes/document-extractor/ui";
import EndNode from "@/app/components/workflow/nodes/end/ui";
import HumanInputNode from "@/app/components/workflow/nodes/human-input/ui";
import IfElseNode from "@/app/components/workflow/nodes/if-else/ui";
import HttpNode from "@/app/components/workflow/nodes/http/ui";
import IterationStartNode from "@/app/components/workflow/nodes/iteration-start/ui";
import IterationNode from "@/app/components/workflow/nodes/iteration/ui";
import KnowledgeBaseNode from "@/app/components/workflow/nodes/knowledge-base/ui";
import KnowledgeIndexNode from "@/app/components/workflow/nodes/knowledge-index/ui";
import KnowledgeRetrievalNode from "@/app/components/workflow/nodes/knowledge-retrieval/ui";
import ListOperatorNode from "@/app/components/workflow/nodes/list-operator/ui";
import LlmNode from "@/app/components/workflow/nodes/llm/ui";
import LoopEndNode from "@/app/components/workflow/nodes/loop-end/ui";
import LoopStartNode from "@/app/components/workflow/nodes/loop-start/ui";
import LoopNode from "@/app/components/workflow/nodes/loop/ui";
import ParameterExtractorNode from "@/app/components/workflow/nodes/parameter-extractor/ui";
import QuestionClassifierNode from "@/app/components/workflow/nodes/question-classifier/ui";
import SimpleNode from "@/app/components/workflow/nodes/simple/ui";
import StartNode from "@/app/components/workflow/nodes/start/ui";
import TemplateTransformNode from "@/app/components/workflow/nodes/template-transform/ui";
import ToolNode from "@/app/components/workflow/nodes/tool/ui";
import TriggerScheduleNode from "@/app/components/workflow/nodes/trigger-schedule/ui";
import TriggerWebhookNode from "@/app/components/workflow/nodes/trigger-webhook/ui";
import VariableAggregatorNode from "@/app/components/workflow/nodes/variable-aggregator/ui";
import VariableAssignerNode from "@/app/components/workflow/nodes/variable-assigner/ui";
import Custom from "@/app/components/workflow/nodes"
import {ComponentType} from "react";
import type {NodeProps} from "reactflow";

export type CustomNodeType =
  | "start"
  | "answer"
  | "agent"
  | "assigner"
  | "code"
  | "dataSource"
  | "dataSourceEmpty"
  | "documentExtractor"
  | "humanInput"
  | "http"
  | "iteration"
  | "iterationStart"
  | "knowledgeIndex"
  | "listOperator"
  | "llm"
  | "loop"
  | "loopEnd"
  | "loopStart"
  | "parameterExtractor"
  | "questionClassifier"
  | "templateTransform"
  | "tool"
  | "variableAssigner"
  | "end"
  | "ifElse"
  | "simple"
  | "knowledgeBase"
  | "knowledgeRetrieval"
  | "triggerSchedule"
  | "triggerWebhook"
  | "variableAggregator"

export const nodeTypes = {
  custom: Custom
};

export const NodeComponentMap: Record<string, ComponentType<Partial<NodeProps>>> = {
  start: StartNode as ComponentType<Partial<NodeProps>>,
  answer: AnswerNode as ComponentType<Partial<NodeProps>>,
  agent: AgentNode as ComponentType<Partial<NodeProps>>,
  assigner: AssignerNode as ComponentType<Partial<NodeProps>>,
  code: CodeNode as ComponentType<Partial<NodeProps>>,
  dataSource: DataSourceNode as ComponentType<Partial<NodeProps>>,
  dataSourceEmpty: DataSourceEmptyNode as ComponentType<Partial<NodeProps>>,
  documentExtractor: DocumentExtractorNode as ComponentType<Partial<NodeProps>>,
  humanInput: HumanInputNode as ComponentType<Partial<NodeProps>>,
  http: HttpNode as ComponentType<Partial<NodeProps>>,
  iteration: IterationNode as ComponentType<Partial<NodeProps>>,
  iterationStart: IterationStartNode as ComponentType<Partial<NodeProps>>,
  knowledgeIndex: KnowledgeIndexNode as ComponentType<Partial<NodeProps>>,
  listOperator: ListOperatorNode as ComponentType<Partial<NodeProps>>,
  llm: LlmNode as ComponentType<Partial<NodeProps>>,
  loop: LoopNode as ComponentType<Partial<NodeProps>>,
  loopEnd: LoopEndNode as ComponentType<Partial<NodeProps>>,
  loopStart: LoopStartNode as ComponentType<Partial<NodeProps>>,
  parameterExtractor: ParameterExtractorNode as ComponentType<Partial<NodeProps>>,
  questionClassifier: QuestionClassifierNode as ComponentType<Partial<NodeProps>>,
  templateTransform: TemplateTransformNode as ComponentType<Partial<NodeProps>>,
  tool: ToolNode as ComponentType<Partial<NodeProps>>,
  variableAssigner: VariableAssignerNode as ComponentType<Partial<NodeProps>>,
  end: EndNode as ComponentType<Partial<NodeProps>>,
  ifElse: IfElseNode as ComponentType<Partial<NodeProps>>,
  simple: SimpleNode as ComponentType<Partial<NodeProps>>,
  knowledgeBase: KnowledgeBaseNode as ComponentType<Partial<NodeProps>>,
  knowledgeRetrieval: KnowledgeRetrievalNode as ComponentType<Partial<NodeProps>>,
  triggerSchedule: TriggerScheduleNode as ComponentType<Partial<NodeProps>>,
  triggerWebhook: TriggerWebhookNode as ComponentType<Partial<NodeProps>>,
  variableAggregator: VariableAggregatorNode as ComponentType<Partial<NodeProps>>,
}
