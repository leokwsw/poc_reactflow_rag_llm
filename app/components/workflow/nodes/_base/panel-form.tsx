"use client";

import { forwardRef } from "react";
import type { InputHTMLAttributes, PropsWithChildren, TextareaHTMLAttributes } from "react";

type PanelFieldProps = PropsWithChildren<{
  label: string;
}>;

export function PanelField({ label, children }: PanelFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-zinc-500">{label}</span>
      {children}
    </label>
  );
}

export const PanelInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function PanelInput(props, ref) {
  return <input ref={ref} {...props} className={`w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 ${props.className ?? ""}`.trim()} />;
});

type PanelTextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  tokenChipRenderer?: (expression: string) => string;
};

function renderTokenizedText(value: string, tokenChipRenderer: (expression: string) => string) {
  const parts: Array<{ type: "text" | "token"; value: string }> = [];
  const matcher = /\{\{#\s*([^}]+?)\s*#\}\}/g;
  let lastIndex = 0;

  for (const match of value.matchAll(matcher)) {
    const fullMatch = match[0] ?? "";
    const expression = (match[1] ?? "").trim();
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      parts.push({
        type: "text",
        value: value.slice(lastIndex, matchIndex),
      });
    }

    parts.push({
      type: "token",
      value: tokenChipRenderer(expression),
    });
    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < value.length) {
    parts.push({
      type: "text",
      value: value.slice(lastIndex),
    });
  }

  return parts;
}

export const PanelTextArea = forwardRef<HTMLTextAreaElement, PanelTextAreaProps>(function PanelTextArea(
  { tokenChipRenderer, className, value, ...props },
  ref,
) {
  const hasTokenOverlay = typeof tokenChipRenderer === "function" && typeof value === "string";
  const renderedParts = hasTokenOverlay ? renderTokenizedText(value, tokenChipRenderer) : [];

  return (
    <div className="relative">
      {hasTokenOverlay && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl border border-transparent px-3 py-2 text-sm leading-5">
          <div className="whitespace-pre-wrap break-words text-zinc-800">
            {renderedParts.length === 0 ? null : renderedParts.map((part, index) => (
              part.type === "token" ? (
                <span
                  key={`${part.type}-${index}`}
                  className="inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 align-middle"
                >
                  ({part.value})
                </span>
              ) : (
                <span key={`${part.type}-${index}`}>{part.value}</span>
              )
            ))}
          </div>
        </div>
      )}
      <textarea
        ref={ref}
        value={value}
        {...props}
        className={`w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 ${
          hasTokenOverlay ? "relative z-10 bg-transparent text-transparent caret-zinc-800 selection:bg-indigo-100" : ""
        } ${className ?? ""}`.trim()}
      />
    </div>
  );
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
