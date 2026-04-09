"use client";

import { MiniMap, useReactFlow } from "reactflow";

type OperatorProps = {
  handleUndo: () => void;
  handleRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

export default function Operator({ handleUndo, handleRedo, canUndo, canRedo }: OperatorProps) {
  const reactflow = useReactFlow();

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 px-1">
      <div className="flex justify-between px-1 pb-2">
        <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-1 shadow-sm">
          <button
            className="rounded px-2 py-1 text-xs hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleUndo}
            disabled={!canUndo}
          >
            Undo
          </button>
          <button
            className="rounded px-2 py-1 text-xs hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleRedo}
            disabled={!canRedo}
          >
            Redo
          </button>
        </div>

        <div className="relative">
          <MiniMap
            pannable
            zoomable
            style={{ width: 102, height: 72 }}
            nodeStrokeWidth={3}
            className="absolute! bottom-10! z-9 m-0! h-[73px]! w-[103px]! rounded-lg! border-[0.5px]! border-divider-subtle! bg-background-default-subtle! shadow-md!"
          />
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white p-1 shadow-sm">
            <button
              className="rounded px-2 py-1 text-xs hover:bg-zinc-100"
              onClick={() => reactflow.zoomIn()}
            >
              +
            </button>
            <button
              className="rounded px-2 py-1 text-xs hover:bg-zinc-100"
              onClick={() => reactflow.zoomOut()}
            >
              -
            </button>
            <button
              className="rounded px-2 py-1 text-xs hover:bg-zinc-100"
              onClick={() => reactflow.fitView()}
            >
              Fit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
