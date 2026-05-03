"use client";

import { CustomNodeType } from "@/app/components/workflow/nodes/types";

type PanelContextMenuProps = {
  x: number;
  y: number;
  hasStartNode: boolean;
  onAddNode: (type: CustomNodeType) => void;
};

type NodeGroup = {
  title: string;
  items: Array<{
    type: CustomNodeType;
    label: string;
    disabled?: boolean;
  }>;
};

export default function PanelContextMenu({
  x,
  y,
  hasStartNode,
  onAddNode,
}: PanelContextMenuProps) {
  const groups: NodeGroup[] = [
    {
      title: "",
      items: [
        { type: "llm", label: "LLM" },
        { type: "knowledgeRetrieval", label: "Knowledge Retrieval" },
        { type: "answer", label: "Answer" },
        { type: "agent", label: "Agent" },
      ],
    },
    {
      title: "Question Understand",
      items: [
        { type: "questionClassifier", label: "Question Classifier" },
      ],
    },
    {
      title: "Logic",
      items: [
        { type: "ifElse", label: "If-Else" },
        { type: "iteration", label: "Iteration" },
        { type: "loop", label: "Loop" },
      ],
    },
    {
      title: "Transform",
      items: [
        { type: "templateTransform", label: "Template Transform" },
        { type: "documentExtractor", label: "Doc Extractor" },
        { type: "parameterExtractor", label: "Parameter Extractor" },
      ],
    },
    {
      title: "Utilities",
      items: [
        { type: "listOperator", label: "List Operator" },
      ],
    },
    {
      title: "Other",
      items: [
        { type: "start", label: "Start", disabled: hasStartNode },
        { type: "end", label: "End" },
        { type: "assigner", label: "Assigner" },
        { type: "dataSource", label: "Data Source" },
        { type: "dataSourceEmpty", label: "Data Source Empty" },
        { type: "iterationStart", label: "Iteration Start" },
        { type: "loopStart", label: "Loop Start" },
        { type: "loopEnd", label: "Loop End" },
        { type: "tool", label: "Tool" },
        { type: "simple", label: "Simple" },
      ],
    },
  ];

  return (
    <div
      className="absolute z-20 inline-flex max-h-[32rem] flex-col overflow-y-auto rounded-md border border-zinc-200 bg-white p-1 shadow-lg"
      style={{ left: x, top: y, width: "fit-content", maxWidth: "20rem" }}
      onClick={(event) => event.stopPropagation()}
    >
      {groups.map((group, groupIndex) => (
        <div key={`${group.title || "default"}-${groupIndex}`} className={groupIndex === 0 ? "" : "mt-2 border-t border-zinc-100 pt-2"}>
          <div className="px-2 pb-1 text-[11px] font-semibold tracking-[0.08em] text-zinc-400">
            {group.title}
          </div>
          <div className="flex flex-col items-stretch">
            {group.items.map((item) => (
              <div key={item.type} className="block">
                <button
                  className="block w-full rounded px-2 py-1.5 text-left text-sm whitespace-nowrap hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => onAddNode(item.type)}
                  disabled={item.disabled}
                  type="button"
                >
                  Add {item.label} Node
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
