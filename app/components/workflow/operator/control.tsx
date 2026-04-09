"use client";

type ControlMode = "pointer" | "hand";

type ControlProps = {
  mode: ControlMode;
  maximizeCanvas: boolean;
  onModePointer: () => void;
  onModeHand: () => void;
  onToggleMaximizeCanvas: () => void;
  onOrganize: () => void;
};

export default function Control({
  mode,
  maximizeCanvas,
  onModePointer,
  onModeHand,
  onToggleMaximizeCanvas,
  onOrganize,
}: ControlProps) {
  return (
    <div className="pointer-events-auto flex flex-col items-center rounded-lg border-[0.5px] border-components-actionbar-border bg-components-actionbar-bg p-0.5 text-text-tertiary shadow-lg">
      <div className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-state-base-hover hover:text-text-secondary">
        +
      </div>
      <div className="my-1 w-3.5 border-b border-zinc-200" />
      <button
        className={`mr-px flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg ${mode === "pointer" ? "bg-state-accent-active text-text-accent" : "hover:bg-state-base-hover hover:text-text-secondary"}`}
        onClick={onModePointer}
      >
        V
      </button>
      <button
        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg ${mode === "hand" ? "bg-state-accent-active text-text-accent" : "hover:bg-state-base-hover hover:text-text-secondary"}`}
        onClick={onModeHand}
      >
        H
      </button>
      <div className="my-1 w-3.5 border-b border-zinc-200" />
      <button
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-state-base-hover hover:text-text-secondary"
        onClick={onOrganize}
      >
        Auto
      </button>
      <button
        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg ${maximizeCanvas ? "bg-state-accent-active text-text-accent" : "hover:bg-state-base-hover hover:text-text-secondary"}`}
        onClick={onToggleMaximizeCanvas}
      >
        {maximizeCanvas ? "Min" : "Max"}
      </button>
    </div>
  );
}
