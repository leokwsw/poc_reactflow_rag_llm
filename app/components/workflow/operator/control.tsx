"use client";

import * as React from "react"

type ControlProps = {
  onOpenAddMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onOrganize: () => void;
  handleModePointer: () => void;
  handleModeHand: () => void;
  mode: "pointer" | "hand";
};

export default function Control(
  {
    onOpenAddMenu,
    onOrganize,
    handleModePointer,
    handleModeHand,
    mode,
  }: ControlProps) {
  const buttonClassName = "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-medium transition hover:bg-zinc-100 hover:text-zinc-900";
  const activeButtonClassName = "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200";

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-2 rounded-[20px] border border-zinc-200/80 bg-white/92 p-2 text-zinc-500 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.35)] backdrop-blur">
      <button
        className={buttonClassName}
        onClick={onOpenAddMenu}
        title="Add Node"
      >
        <span className="text-lg leading-none">+</span>
      </button>
      <div className="h-px w-6 bg-zinc-200"/>
      <button
        className={`${buttonClassName} ${mode === "pointer" ? activeButtonClassName : ""}`.trim()}
        onClick={handleModePointer}>
        <span aria-hidden="true">↖</span>
      </button>
      <button
        className={`${buttonClassName} ${mode === "hand" ? activeButtonClassName : ""}`.trim()}
        onClick={handleModeHand}>
        <span aria-hidden="true">✋</span>
      </button>
      <div className="h-px w-6 bg-zinc-200"/>
      <button
        className={buttonClassName}
        onClick={onOrganize}
        title="Workflow Organize"
      >
        <span className="text-xs font-semibold tracking-wide">Org</span>
      </button>
    </div>
  );
}
