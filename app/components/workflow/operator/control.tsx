"use client";

type ControlProps = {
  maximizeCanvas: boolean;
  onOpenAddMenu: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onToggleMaximizeCanvas: () => void;
  onOrganize: () => void;
};

export default function Control({
  maximizeCanvas,
  onOpenAddMenu,
  onToggleMaximizeCanvas,
  onOrganize,
}: ControlProps) {
  return (
    <div className="pointer-events-auto flex flex-col items-center rounded-lg border-[0.5px] border-components-actionbar-border bg-components-actionbar-bg p-0.5 text-text-tertiary shadow-lg">
      <button
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-state-base-hover hover:text-text-secondary"
        onClick={onOpenAddMenu}
      >
        +
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
