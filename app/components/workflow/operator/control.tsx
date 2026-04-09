"use client";

import * as React from "react"

type ControlProps = {
  onOpenAddMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onOrganize: () => void;
  handleModePointer: () => void;
  handleModeHand: () => void;
};

export default function Control(
  {
    onOpenAddMenu,
    onOrganize,
    handleModePointer,
    handleModeHand
  }: ControlProps) {
  return (
    <div
      className="pointer-events-auto flex flex-col items-center rounded-lg border-[0.5px] border-components-actionbar-border bg-components-actionbar-bg p-0.5 text-text-tertiary shadow-lg">
      <button
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-state-base-hover hover:text-text-secondary"
        onClick={onOpenAddMenu}
      >
        +
      </button>
      <div className="my-1 w-3.5 border-b border-zinc-200"/>
      <button
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-state-base-hover hover:text-text-secondary"
        onClick={handleModePointer}>
        Point
      </button>
      <button
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-state-base-hover hover:text-text-secondary"
        onClick={handleModeHand}>
        Hand
      </button>
      <div className="my-1 w-3.5 border-b border-zinc-200"/>
      <button
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-state-base-hover hover:text-text-secondary"
        onClick={onOrganize}
        title="Workflow Organize"
      >
        Org
      </button>
    </div>
  );
}
