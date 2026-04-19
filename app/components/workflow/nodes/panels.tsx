"use client";

import AgentPanel from "@/app/components/workflow/nodes/agent/panel";
import AssignerPanel from "@/app/components/workflow/nodes/assigner/panel";
import CodePanel from "@/app/components/workflow/nodes/code/panel";
import DataSourceEmptyPanel from "@/app/components/workflow/nodes/data-source-empty/panel";
import DataSourcePanel from "@/app/components/workflow/nodes/data-source/panel";
import EndPanel from "@/app/components/workflow/nodes/end/panel";
import HttpPanel from "@/app/components/workflow/nodes/http/panel";
import IfElsePanel from "@/app/components/workflow/nodes/if-else/panel";
import IterationStartPanel from "@/app/components/workflow/nodes/iteration-start/panel";
import IterationPanel from "@/app/components/workflow/nodes/iteration/panel";
import KnowledgeBasePanel from "@/app/components/workflow/nodes/knowledge-base/panel";
import KnowledgeRetrievalPanel from "@/app/components/workflow/nodes/knowledge-retrieval/panel";
import ListOperatorPanel from "@/app/components/workflow/nodes/list-operator/panel";
import LlmPanel from "@/app/components/workflow/nodes/llm/panel";
import LoopEndPanel from "@/app/components/workflow/nodes/loop-end/panel";
import LoopStartPanel from "@/app/components/workflow/nodes/loop-start/panel";
import LoopPanel from "@/app/components/workflow/nodes/loop/panel";
import NotePanel from "@/app/components/workflow/nodes/note/panel";
import ParameterExtractorPanel from "@/app/components/workflow/nodes/parameter-extractor/panel";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";
import QuestionClassifierPanel from "@/app/components/workflow/nodes/question-classifier/panel";
import SimplePanel from "@/app/components/workflow/nodes/simple/panel";
import StartPanel from "@/app/components/workflow/nodes/start/panel";
import TemplateTransformPanel from "@/app/components/workflow/nodes/template-transform/panel";
import ToolPanel from "@/app/components/workflow/nodes/tool/panel";
import VariableAssignerPanel from "@/app/components/workflow/nodes/variable-assigner/panel";
import type { ComponentType } from "react";

export const nodeSettingsPanelMap: Record<string, ComponentType<NodePanelProps>> = {
  start: StartPanel,
  llm: LlmPanel,
  ifElse: IfElsePanel,
  questionClassifier: QuestionClassifierPanel,
  agent: AgentPanel,
  assigner: AssignerPanel,
  code: CodePanel,
  dataSource: DataSourcePanel,
  dataSourceEmpty: DataSourceEmptyPanel,
  http: HttpPanel,
  iteration: IterationPanel,
  iterationStart: IterationStartPanel,
  listOperator: ListOperatorPanel,
  end: EndPanel,
  loop: LoopPanel,
  loopEnd: LoopEndPanel,
  loopStart: LoopStartPanel,
  note: NotePanel,
  parameterExtractor: ParameterExtractorPanel,
  simple: SimplePanel,
  templateTransform: TemplateTransformPanel,
  tool: ToolPanel,
  variableAssigner: VariableAssignerPanel,
  knowledgeBase: KnowledgeBasePanel,
  knowledgeRetrieval: KnowledgeRetrievalPanel,
};
