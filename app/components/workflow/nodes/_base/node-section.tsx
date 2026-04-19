"use client";

import type { ReactNode } from "react";

type NodeSectionProps = {
  label: string;
  children: ReactNode;
};

export default function NodeSection({ label, children }: NodeSectionProps) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      {children}
    </div>
  );
}

