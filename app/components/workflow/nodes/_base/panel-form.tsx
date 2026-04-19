"use client";

import type { InputHTMLAttributes, PropsWithChildren, TextareaHTMLAttributes } from "react";

type PanelFieldProps = PropsWithChildren<{
  label: string;
}>;

export function PanelField({ label, children }: PanelFieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-zinc-600">{label}</span>
      {children}
    </label>
  );
}

export function PanelInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded border border-zinc-300 px-2 py-1.5 text-sm ${props.className ?? ""}`.trim()} />;
}

export function PanelTextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full rounded border border-zinc-300 px-2 py-1.5 text-sm ${props.className ?? ""}`.trim()} />;
}

export function PanelCard({ children }: PropsWithChildren) {
  return <div className="space-y-2 rounded-lg border border-zinc-200 p-3">{children}</div>;
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
      className={`w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 ${className ?? ""}`.trim()}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}
