"use client";

import AgentPanel from "@/app/components/workflow/nodes/agent/panel";
import EndPanel from "@/app/components/workflow/nodes/end/panel";
import HttpPanel from "@/app/components/workflow/nodes/http/panel";
import IfElsePanel from "@/app/components/workflow/nodes/if-else/panel";
import KnowledgeRetrievalPanel from "@/app/components/workflow/nodes/knowledge-retrieval/panel";
import LlmPanel from "@/app/components/workflow/nodes/llm/panel";
import NotePanel from "@/app/components/workflow/nodes/note/panel";
import type { CustomNodeType } from "@/app/components/workflow/nodes/allowed";
import type { NodePanelProps } from "@/app/components/workflow/nodes/panel-types";
import QuestionClassifierPanel from "@/app/components/workflow/nodes/question-classifier/panel";
import StartPanel from "@/app/components/workflow/nodes/start/panel";
import type { ComponentType } from "react";

export const nodeSettingsPanelMap: Record<CustomNodeType, ComponentType<NodePanelProps>> = {
  start: StartPanel,
  end: EndPanel,
  llm: LlmPanel,
  agent: AgentPanel,
  questionClassifier: QuestionClassifierPanel,
  knowledgeRetrieval: KnowledgeRetrievalPanel,
  ifElse: IfElsePanel,
  http: HttpPanel,
  note: NotePanel,
};
