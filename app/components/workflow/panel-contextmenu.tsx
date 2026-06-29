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
    description: string;
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
        { type: "start", label: "開始", description: "定義工作流入口，接收使用者問題及上載檔案。", disabled: hasStartNode },
        { type: "end", label: "結束", description: "整理並輸出工作流的最終答案或指定欄位。"},
        { type: "llm", label: "LLM", description: "呼叫語言模型，按提示詞生成回應或中間結果。"},
        { type: "agent", label: "Agent", description: "讓 AI 代理根據指令自主推理，並可配合工具完成任務。"},
        { type: "tool", label: "Tool", description: "從 Workspace Tools 選擇最新工具定義，動態呼叫外部能力。"},
        { type: "questionClassifier", label: "問題分類", description: "分析輸入問題，將它分到預設類別並引導後續分支。"},
        { type: "knowledgeRetrieval", label: "知識檢索", description: "從已建立的知識庫搜尋相關內容，提供上下文予後續節點。"},
        { type: "ifElse", label: "If / Else", description: "根據條件判斷走不同分支，處理路由及例外情況。"},
        { type: "http", label: "HTTP", description: "呼叫外部 HTTP API，取得或提交資料畀工作流使用。"},
        { type: "note", label: "Note Memo", description: "在畫布加入自由文字備忘，不需要連接任何邊。"},
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
                  <span className="block font-medium">{item.label} Node</span>
                  <span className="mt-0.5 block whitespace-normal text-xs leading-5 text-zinc-500">
                    {item.description}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
