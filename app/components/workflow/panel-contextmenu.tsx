"use client";

import type { WorkflowNodeType } from "@/app/components/workflow/nodes/types";

type PanelContextMenuProps = {
  x: number;
  y: number;
  hasStartNode: boolean;
  hasEndNode: boolean;
  hasAnswerNode: boolean;
  onAddNode: (type: WorkflowNodeType) => void;
};

export default function PanelContextMenu({
  x,
  y,
  hasStartNode,
  hasEndNode,
  hasAnswerNode,
  onAddNode,
}: PanelContextMenuProps) {
  return (
    <div
      className="absolute z-20 min-w-44 rounded-md border border-zinc-200 bg-white p-1 shadow-lg"
      style={{ left: x, top: y }}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => onAddNode("start")}
        disabled={hasStartNode}
      >
        Add Start Node
      </button>
      <button
        className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100"
        onClick={() => onAddNode("llm")}
      >
        Add LLM Node
      </button>
      <button
        className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => onAddNode("end")}
        disabled={hasEndNode}
      >
        Add End Node
      </button>
      <button
        className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100"
        onClick={() => onAddNode("ifElse")}
      >
        Add If-Else Node
      </button>
      <button
        className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
        onClick={() => onAddNode("answer")}
        disabled={hasAnswerNode}
      >
        Add Answer Node
      </button>
      <button
        className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100"
        onClick={() => onAddNode("note")}
      >
        Add Note Node
      </button>
      <button
        className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100"
        onClick={() => onAddNode("simple")}
      >
        Add Simple Node
      </button>
      <button
        className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100"
        onClick={() => onAddNode("knowledgeBase")}
      >
        Add Knowledge Base Node
      </button>
      <button
        className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-100"
        onClick={() => onAddNode("knowledgeRetrieval")}
      >
        Add Knowledge Retrieval Node
      </button>
    </div>
  );
}
