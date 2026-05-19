"use client";

import {useState} from "react";
import {getNodesBounds, getViewportForBounds, MiniMap, useReactFlow, useStore} from "reactflow";

type ExportView = "current" | "workflow";
type ExportFormat = "png" | "jpeg" | "svg";

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
  const [exportOpen, setExportOpen] = useState(false);
  const [exportView, setExportView] = useState<ExportView>("current");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportImage() {
    const flowElement = document.querySelector<HTMLElement>(".react-flow");
    const targetElement = document.querySelector<HTMLElement>(
      exportView === "workflow" ? ".react-flow__viewport" : ".react-flow__renderer",
    );
    if (!flowElement || !targetElement) {
      return;
    }

    const {toJpeg, toPng, toSvg} = await import("html-to-image");
    const flowRect = flowElement.getBoundingClientRect();
    const nodes = reactflow.getNodes().filter((node) => !node.hidden);
    const bounds = nodes.length > 0 ? getNodesBounds(nodes) : {x: 0, y: 0, width: flowRect.width, height: flowRect.height};
    const workflowWidth = Math.max(800, Math.ceil(bounds.width + 240));
    const workflowHeight = Math.max(600, Math.ceil(bounds.height + 240));
    const viewport = getViewportForBounds(bounds, workflowWidth, workflowHeight, 0.25, 2, 0.12);
    const options = {
      backgroundColor: "#f5f7fb",
      cacheBust: true,
      filter: (node: HTMLElement) => node.dataset?.exportIgnore !== "true",
      ...(exportView === "workflow"
        ? {
          width: workflowWidth,
          height: workflowHeight,
          style: {
            width: `${workflowWidth}px`,
            height: `${workflowHeight}px`,
            transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          },
        }
        : {
          width: Math.ceil(flowRect.width),
          height: Math.ceil(flowRect.height),
        }),
    };

    setIsExporting(true);
    try {
      const dataUrl = exportFormat === "svg"
        ? await toSvg(targetElement, options)
        : exportFormat === "jpeg"
          ? await toJpeg(targetElement, {...options, quality: 0.95})
          : await toPng(targetElement, options);
      const link = document.createElement("a");
      link.download = `workflow-${exportView}.${exportFormat === "jpeg" ? "jpg" : exportFormat}`;
      link.href = dataUrl;
      link.click();
      setExportOpen(false);
    } finally {
      setIsExporting(false);
    }
  }

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
        <div className="relative flex items-center gap-1 rounded-2xl border border-zinc-200/80 bg-white/92 p-1.5 shadow-[0_12px_40px_-20px_rgba(15,23,42,0.4)] backdrop-blur">
          <button
            className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-100"
            onClick={() => setExportOpen((value) => !value)}
            type="button"
          >
            Export
          </button>
          <div className="h-6 w-px bg-zinc-200" />
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

          {exportOpen ? (
            <div className="absolute bottom-12 right-0 w-64 rounded-2xl border border-zinc-200 bg-white p-3 text-xs text-zinc-700 shadow-xl">
              <div className="mb-3">
                <p className="mb-1.5 font-semibold text-zinc-800">Export View</p>
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-100 p-1">
                  {([
                    ["current", "Current view"],
                    ["workflow", "This workflow"],
                  ] as Array<[ExportView, string]>).map(([value, label]) => (
                    <button
                      key={value}
                      className={`rounded-lg px-2 py-1.5 font-medium transition ${exportView === value ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
                      onClick={() => setExportView(value)}
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-3">
                <p className="mb-1.5 font-semibold text-zinc-800">Export Format</p>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-100 p-1">
                  {(["png", "jpeg", "svg"] as ExportFormat[]).map((value) => (
                    <button
                      key={value}
                      className={`rounded-lg px-2 py-1.5 font-medium uppercase transition ${exportFormat === value ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-800"}`}
                      onClick={() => setExportFormat(value)}
                      type="button"
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
              <button
                className="w-full rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
                disabled={isExporting}
                onClick={() => void handleExportImage()}
                type="button"
              >
                {isExporting ? "Exporting..." : "Export Image"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
