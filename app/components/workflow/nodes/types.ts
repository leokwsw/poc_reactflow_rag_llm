import AnswerNode from "@/app/components/workflow/nodes/answer/ui";
import EndNode from "@/app/components/workflow/nodes/end/ui";
import IfElseNode from "@/app/components/workflow/nodes/if-else/ui";
import KnowledgeBaseNode from "@/app/components/workflow/nodes/knowledge-base/ui";
import KnowledgeRetrievalNode from "@/app/components/workflow/nodes/knowledge-retrieval/ui";
import LlmNode from "@/app/components/workflow/nodes/llm/ui";
import NoteNode from "@/app/components/workflow/nodes/note/ui";
import SimpleNode from "@/app/components/workflow/nodes/simple/ui";
import StartNode from "@/app/components/workflow/nodes/start/ui";
import Custom from "@/app/components/workflow/nodes"
import {ComponentType} from "react";
import type {NodeProps} from "reactflow";

export type CustomNodeType =
  | "start"
  | "llm"
  | "end"
  | "ifElse"
  | "answer"
  | "note"
  | "simple"
  | "knowledgeBase"
  | "knowledgeRetrieval"

export const nodeTypes = {
  custom: Custom
};

export const NodeComponentMap: Record<string, ComponentType<Partial<NodeProps>>> = {
  start: StartNode as ComponentType<Partial<NodeProps>>,
  llm: LlmNode as ComponentType<Partial<NodeProps>>,
  end: EndNode as ComponentType<Partial<NodeProps>>,
  ifElse: IfElseNode as ComponentType<Partial<NodeProps>>,
  answer: AnswerNode as ComponentType<Partial<NodeProps>>,
  note: NoteNode as ComponentType<Partial<NodeProps>>,
  simple: SimpleNode as ComponentType<Partial<NodeProps>>,
  knowledgeBase: KnowledgeBaseNode as ComponentType<Partial<NodeProps>>,
  knowledgeRetrieval: KnowledgeRetrievalNode as ComponentType<Partial<NodeProps>>,
}
