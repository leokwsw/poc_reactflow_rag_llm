import AnswerNode from "@/app/components/workflow/nodes/answer-node";
import EndNode from "@/app/components/workflow/nodes/end-node";
import IfElseNode from "@/app/components/workflow/nodes/if-else-node";
import LlmNode from "@/app/components/workflow/nodes/llm-node";
import NoteNode from "@/app/components/workflow/nodes/note-node";
import StartNode from "@/app/components/workflow/nodes/start-node";

export type WorkflowNodeType = "start" | "llm" | "end" | "ifElse" | "answer" | "note";

export const nodeTypes = {
  start: StartNode,
  llm: LlmNode,
  end: EndNode,
  ifElse: IfElseNode,
  answer: AnswerNode,
  note: NoteNode,
};
