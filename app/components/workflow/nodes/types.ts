import AnswerNode from "@/app/components/workflow/nodes/answer-node";
import EndNode from "@/app/components/workflow/nodes/end-node";
import IfElseNode from "@/app/components/workflow/nodes/if-else-node";
import KnowledgeBaseNode from "@/app/components/workflow/nodes/knowledge-base-node";
import KnowledgeRetrievalNode from "@/app/components/workflow/nodes/knowledge-retrieval-node";
import LlmNode from "@/app/components/workflow/nodes/llm-node";
import NoteNode from "@/app/components/workflow/nodes/note-node";
import SimpleNode from "@/app/components/workflow/nodes/simple-node";
import StartNode from "@/app/components/workflow/nodes/start-node";
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
