import AgentNode from "@/app/components/workflow/nodes/agent/ui";
import EndNode from "@/app/components/workflow/nodes/end/ui";
import IfElseNode from "@/app/components/workflow/nodes/if-else/ui";
import HttpNode from "@/app/components/workflow/nodes/http/ui";
import KnowledgeRetrievalNode from "@/app/components/workflow/nodes/knowledge-retrieval/ui";
import LlmNode from "@/app/components/workflow/nodes/llm/ui";
import NoteNode from "@/app/components/workflow/nodes/note/ui";
import QuestionClassifierNode from "@/app/components/workflow/nodes/question-classifier/ui";
import StartNode from "@/app/components/workflow/nodes/start/ui";
import Custom from "@/app/components/workflow/nodes"
import type { CustomNodeType as AllowedCustomNodeType } from "@/app/components/workflow/nodes/allowed";
import {ComponentType} from "react";
import type {NodeProps} from "reactflow";

export type { CustomNodeType } from "@/app/components/workflow/nodes/allowed";

export const nodeTypes = {
  custom: Custom
};

export const NodeComponentMap: Record<AllowedCustomNodeType, ComponentType<Partial<NodeProps>>> = {
  start: StartNode as ComponentType<Partial<NodeProps>>,
  end: EndNode as ComponentType<Partial<NodeProps>>,
  llm: LlmNode as ComponentType<Partial<NodeProps>>,
  agent: AgentNode as ComponentType<Partial<NodeProps>>,
  questionClassifier: QuestionClassifierNode as ComponentType<Partial<NodeProps>>,
  knowledgeRetrieval: KnowledgeRetrievalNode as ComponentType<Partial<NodeProps>>,
  ifElse: IfElseNode as ComponentType<Partial<NodeProps>>,
  http: HttpNode as ComponentType<Partial<NodeProps>>,
  note: NoteNode as ComponentType<Partial<NodeProps>>,
}
