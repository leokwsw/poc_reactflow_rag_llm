"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes, PropsWithChildren, TextareaHTMLAttributes } from "react";

type PanelFieldProps = PropsWithChildren<{
  label: string;
}>;

export function PanelField({ label, children }: PanelFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

export const PanelInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function PanelInput(props, ref) {
  return <input ref={ref} {...props} className={`w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 ${props.className ?? ""}`.trim()} />;
});

export const PanelTextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function PanelTextArea(props, ref) {
  return <textarea ref={ref} {...props} className={`w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 ${props.className ?? ""}`.trim()} />;
});

export function PanelCard({ children }: PropsWithChildren) {
  return <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50/80 p-3.5">{children}</div>;
}

type PanelInlineActionsProps = PropsWithChildren;

export function PanelInlineActions({ children }: PanelInlineActionsProps) {
  return <div className="flex justify-end">{children}</div>;
}

type PanelButtonProps = PropsWithChildren<{
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
  danger?: boolean;
  className?: string;
}>;

export function PanelButton({ children, type = "button", onClick, danger = false, className }: PanelButtonProps) {
  if (danger) {
    return (
      <button className={`text-xs text-red-600 hover:text-red-700 ${className ?? ""}`.trim()} onClick={onClick} type={type}>
        {children}
      </button>
    );
  }

  return (
    <button
      className={`w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 ${className ?? ""}`.trim()}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}
