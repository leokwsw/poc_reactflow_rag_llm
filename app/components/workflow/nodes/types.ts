import AnswerNode from "@/app/components/workflow/nodes/answer-node";
import EndNode from "@/app/components/workflow/nodes/end-node";
import IfElseNode from "@/app/components/workflow/nodes/if-else-node";
import KnowledgeBaseNode from "@/app/components/workflow/nodes/knowledge-base-node";
import KnowledgeRetrievalNode from "@/app/components/workflow/nodes/knowledge-retrieval-node";
import LlmNode from "@/app/components/workflow/nodes/llm-node";
import NoteNode from "@/app/components/workflow/nodes/note-node";
import SimpleNode from "@/app/components/workflow/nodes/simple-node";
import StartNode from "@/app/components/workflow/nodes/start-node";

export type WorkflowNodeType =
  | "start"
  | "llm"
  | "end"
  | "ifElse"
  | "answer"
  | "note"
  | "simple"
  | "knowledgeBase"
  | "knowledgeRetrieval";

export const nodeTypes = {
  start: StartNode,
  llm: LlmNode,
  end: EndNode,
  ifElse: IfElseNode,
  answer: AnswerNode,
  note: NoteNode,
  simple: SimpleNode,
  knowledgeBase: KnowledgeBaseNode,
  knowledgeRetrieval: KnowledgeRetrievalNode,
};
