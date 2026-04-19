"use client";

import type { ReactNode } from "react";

type NodeTokenProps = {
  children: ReactNode;
  muted?: boolean;
};

export default function NodeToken({ children, muted = false }: NodeTokenProps) {
  return (
    <div
      className={`rounded-lg border px-2.5 py-1.5 text-xs ${
        muted
          ? "border-zinc-200 bg-zinc-50 text-zinc-500"
          : "border-zinc-200 bg-zinc-100 text-zinc-700"
      }`}
    >
      {children}
    </div>
  );
}

