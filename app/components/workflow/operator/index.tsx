"use client";

import { MiniMap, useReactFlow, useStore } from "reactflow";

type OperatorProps = {
  handleUndo: () => void;
  handleRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

export default function Operator({ handleUndo, handleRedo, canUndo, canRedo }: OperatorProps) {
  const reactflow = useReactFlow();
  const zoom = useStore((state) => state.transform[2]);
  const zoomPercent = Math.round(zoom * 100);

  return (
    <>
      <div className="absolute bottom-4 left-4 z-10">
        <div className="flex items-center gap-1 rounded-2xl border border-zinc-200/80 bg-white/92 p-1.5 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.4)] backdrop-blur">
          <button
            className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleUndo}
            disabled={!canUndo}
          >
            Undo
          </button>
          <button
            className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleRedo}
            disabled={!canRedo}
          >
            Redo
          </button>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10 flex items-end gap-3">
        <div className="relative">
          <MiniMap
            pannable
            zoomable
            style={{ width: 132, height: 96 }}
            nodeStrokeWidth={3}
            className="m-0! h-24! w-[132px]! rounded-2xl! border border-zinc-200/80! bg-white/88! shadow-[0_12px_40px_-20px_rgba(15,23,42,0.35)] backdrop-blur"
          />
        </div>
        <div className="flex items-center gap-1 rounded-2xl border border-zinc-200/80 bg-white/92 p-1.5 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.4)] backdrop-blur">
          <div className="rounded-xl bg-zinc-100 px-2.5 py-1.5 text-xs font-semibold text-zinc-600">
            {zoomPercent}%
          </div>
          <div className="h-6 w-px bg-zinc-200" />
          <button
            className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
            onClick={() => reactflow.zoomIn()}
          >
            +
          </button>
          <button
            className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
            onClick={() => reactflow.zoomOut()}
          >
            -
          </button>
          <button
            className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
            onClick={() => reactflow.fitView({ padding: 0.2, duration: 250 })}
          >
            Fit
          </button>
        </div>
      </div>
    </>
  );
}
