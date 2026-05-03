"use client";

import AgentPanel from "@/app/components/workflow/nodes/agent/panel";
import AnswerPanel from "@/app/components/workflow/nodes/answer/panel";
import AssignerPanel from "@/app/components/workflow/nodes/assigner/panel";
import CodePanel from "@/app/components/workflow/nodes/code/panel";
import DataSourceEmptyPanel from "@/app/components/workflow/nodes/data-source-empty/panel";
import DataSourcePanel from "@/app/components/workflow/nodes/data-source/panel";
import DocumentExtractorPanel from "@/app/components/workflow/nodes/document-extractor/panel";
import EndPanel from "@/app/components/workflow/nodes/end/panel";
import HttpPanel from "@/app/components/workflow/nodes/http/panel";
import HumanInputPanel from "@/app/components/workflow/nodes/human-input/panel";
import IfElsePanel from "@/app/components/workflow/nodes/if-else/panel";
import IterationStartPanel from "@/app/components/workflow/nodes/iteration-start/panel";
import IterationPanel from "@/app/components/workflow/nodes/iteration/panel";
import KnowledgeRetrievalPanel from "@/app/components/workflow/nodes/knowledge-retrieval/panel";
import ListOperatorPanel from "@/app/components/workflow/nodes/list-operator/panel";
import LlmPanel from "@/app/components/workflow/nodes/llm/panel";
import LoopEndPanel from "@/app/components/workflow/nodes/loop-end/panel";
import LoopStartPanel from "@/app/components/workflow/nodes/loop-start/panel";
import LoopPanel from "@/app/components/workflow/nodes/loop/panel";
import ParameterExtractorPanel from "@/app/components/workflow/nodes/parameter-extractor/panel";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";
import QuestionClassifierPanel from "@/app/components/workflow/nodes/question-classifier/panel";
import SimplePanel from "@/app/components/workflow/nodes/simple/panel";
import StartPanel from "@/app/components/workflow/nodes/start/panel";
import TemplateTransformPanel from "@/app/components/workflow/nodes/template-transform/panel";
import ToolPanel from "@/app/components/workflow/nodes/tool/panel";
import TriggerSchedulePanel from "@/app/components/workflow/nodes/trigger-schedule/panel";
import TriggerWebhookPanel from "@/app/components/workflow/nodes/trigger-webhook/panel";
import VariableAggregatorPanel from "@/app/components/workflow/nodes/variable-aggregator/panel";
import VariableAssignerPanel from "@/app/components/workflow/nodes/variable-assigner/panel";
import type { ComponentType } from "react";

export const nodeSettingsPanelMap: Record<string, ComponentType<NodePanelProps>> = {
  start: StartPanel,
  answer: AnswerPanel,
  llm: LlmPanel,
  ifElse: IfElsePanel,
  questionClassifier: QuestionClassifierPanel,
  agent: AgentPanel,
  assigner: AssignerPanel,
  code: CodePanel,
  dataSource: DataSourcePanel,
  dataSourceEmpty: DataSourceEmptyPanel,
  documentExtractor: DocumentExtractorPanel,
  humanInput: HumanInputPanel,
  http: HttpPanel,
  iteration: IterationPanel,
  iterationStart: IterationStartPanel,
  listOperator: ListOperatorPanel,
  end: EndPanel,
  loop: LoopPanel,
  loopEnd: LoopEndPanel,
  loopStart: LoopStartPanel,
  parameterExtractor: ParameterExtractorPanel,
  simple: SimplePanel,
  templateTransform: TemplateTransformPanel,
  tool: ToolPanel,
  triggerSchedule: TriggerSchedulePanel,
  triggerWebhook: TriggerWebhookPanel,
  variableAggregator: VariableAggregatorPanel,
  variableAssigner: VariableAssignerPanel,
  knowledgeRetrieval: KnowledgeRetrievalPanel,
};
