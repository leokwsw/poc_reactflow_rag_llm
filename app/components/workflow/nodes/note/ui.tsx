"use client";

import {useState} from "react";
import type {NodeProps} from "reactflow";
import {useReactFlow} from "reactflow";
import type {WorkflowNodeDataBase} from "@/app/components/workflow/nodes/_base/workflow-node-data";

type NoteColor = "sky" | "cyan" | "emerald" | "yellow" | "pink" | "violet";
type NoteSize = "small" | "medium" | "large";

type NoteNodeData = WorkflowNodeDataBase & {
  content?: string;
  author?: string;
  color?: NoteColor;
  fontSize?: NoteSize;
  bold?: boolean;
  italic?: boolean;
  strike?: boolean;
  list?: boolean;
  link?: string;
};

const colorOptions: Array<{value: NoteColor; className: string; label: string}> = [
  {value: "sky", className: "bg-sky-100 border-sky-200", label: "Sky"},
  {value: "cyan", className: "bg-cyan-100 border-cyan-200", label: "Cyan"},
  {value: "emerald", className: "bg-emerald-100 border-emerald-200", label: "Green"},
  {value: "yellow", className: "bg-yellow-100 border-yellow-200", label: "Yellow"},
  {value: "pink", className: "bg-pink-100 border-pink-200", label: "Pink"},
  {value: "violet", className: "bg-violet-100 border-violet-200", label: "Violet"},
];

const noteColorClassMap: Record<NoteColor, string> = {
  sky: "border-sky-300 bg-sky-50 text-slate-700 focus-within:border-sky-400 focus-within:ring-sky-200",
  cyan: "border-cyan-300 bg-cyan-50 text-slate-700 focus-within:border-cyan-400 focus-within:ring-cyan-200",
  emerald: "border-emerald-300 bg-emerald-50 text-slate-700 focus-within:border-emerald-400 focus-within:ring-emerald-200",
  yellow: "border-yellow-300 bg-yellow-50 text-slate-700 focus-within:border-yellow-400 focus-within:ring-yellow-200",
  pink: "border-pink-300 bg-pink-50 text-slate-700 focus-within:border-pink-400 focus-within:ring-pink-200",
  violet: "border-violet-300 bg-violet-50 text-slate-700 focus-within:border-violet-400 focus-within:ring-violet-200",
};

const fontSizeClassMap: Record<NoteSize, string> = {
  small: "text-sm leading-6",
  medium: "text-base leading-7",
  large: "text-lg leading-8",
};

const sizeLabelMap: Record<NoteSize, string> = {
  small: "小",
  medium: "中",
  large: "大",
};

export default function NoteNode({id, data}: NodeProps<NoteNodeData>) {
  const {setNodes} = useReactFlow();
  const [showColors, setShowColors] = useState(false);
  const [showSizes, setShowSizes] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const color = data.color ?? "sky";
  const fontSize = data.fontSize ?? "medium";
  const content = data.content ?? "";

  function patchData(patch: Partial<NoteNodeData>) {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === id
          ? {
            ...node,
            data: {
              ...node.data,
              ...patch,
            },
          }
          : node,
      ),
    );
  }

  const editor = (
    <textarea
      className={`nodrag nopan min-h-[116px] w-[480px] resize-none border-0 bg-transparent px-6 py-5 outline-none placeholder:text-slate-400 ${fontSizeClassMap[fontSize]} ${
        data.bold ? "font-bold" : "font-medium"
      } ${data.italic ? "italic" : ""} ${data.strike ? "line-through" : ""}`.trim()}
      placeholder="寫下您的筆記..."
      value={content}
      onChange={(event) => patchData({content: event.target.value})}
    />
  );

  return (
    <div className="relative">
      <div
        className="nodrag nopan absolute -top-[76px] left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-lg"
        data-export-ignore="true"
      >
        <div className="relative">
          <button
            className={`h-8 w-8 rounded-full border ${colorOptions.find((item) => item.value === color)?.className ?? colorOptions[0].className}`}
            type="button"
            title="Color"
            onClick={() => {
              setShowColors((value) => !value);
              setShowSizes(false);
              setShowLinkInput(false);
            }}
          />
          {showColors ? (
            <div className="absolute bottom-12 left-1/2 z-30 grid w-[92px] -translate-x-1/2 grid-cols-[repeat(3,20px)] justify-center gap-2 rounded-xl border border-zinc-200 bg-white p-2 shadow-xl">
              {colorOptions.map((item) => (
                <button
                  key={item.value}
                  className={`h-5 w-5 shrink-0 rounded-full border ${item.className}`}
                  type="button"
                  title={item.label}
                  onClick={() => {
                    patchData({color: item.value});
                    setShowColors(false);
                  }}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="h-7 w-px bg-zinc-200" />

        <div className="relative">
          <button
            className="rounded-xl px-2 py-1.5 text-sm font-semibold text-slate-600 transition hover:bg-zinc-100"
            type="button"
            title="Font size"
            onClick={() => {
              setShowSizes((value) => !value);
              setShowColors(false);
              setShowLinkInput(false);
            }}
          >
            Aa {sizeLabelMap[fontSize]}
          </button>
          {showSizes ? (
            <div className="absolute left-0 top-11 w-28 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
              {(["small", "medium", "large"] as NoteSize[]).map((item) => (
                <button
                  key={item}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 hover:bg-zinc-50"
                  type="button"
                  onClick={() => {
                    patchData({fontSize: item});
                    setShowSizes(false);
                  }}
                >
                  {sizeLabelMap[item]}
                  {fontSize === item ? <span className="text-blue-600">✓</span> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="h-7 w-px bg-zinc-200" />

        <button
          className={`rounded-xl px-2.5 py-1.5 text-lg font-bold transition hover:bg-zinc-100 ${data.bold ? "bg-zinc-100 text-slate-900" : "text-slate-600"}`}
          type="button"
          title="Bold"
          onClick={() => patchData({bold: !data.bold})}
        >
          B
        </button>
        <button
          className={`rounded-xl px-2.5 py-1.5 text-lg italic transition hover:bg-zinc-100 ${data.italic ? "bg-zinc-100 text-slate-900" : "text-slate-600"}`}
          type="button"
          title="Italic"
          onClick={() => patchData({italic: !data.italic})}
        >
          I
        </button>
        <button
          className={`rounded-xl px-2.5 py-1.5 text-lg line-through transition hover:bg-zinc-100 ${data.strike ? "bg-zinc-100 text-slate-900" : "text-slate-600"}`}
          type="button"
          title="Strikethrough"
          onClick={() => patchData({strike: !data.strike})}
        >
          S
        </button>

        <div className="relative">
          <button
            className={`rounded-xl px-2.5 py-1.5 text-sm font-semibold transition hover:bg-zinc-100 ${data.link ? "bg-zinc-100 text-slate-900" : "text-slate-600"}`}
            type="button"
            title="Link"
            onClick={() => {
              setShowLinkInput((value) => !value);
              setShowColors(false);
              setShowSizes(false);
            }}
          >
            Link
          </button>
          {showLinkInput ? (
            <div className="absolute left-0 top-11 w-64 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
              <input
                className="w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                placeholder="https://example.com"
                value={data.link ?? ""}
                onChange={(event) => patchData({link: event.target.value})}
              />
            </div>
          ) : null}
        </div>

        <button
          className={`rounded-xl px-2.5 py-1.5 text-sm font-semibold transition hover:bg-zinc-100 ${data.list ? "bg-zinc-100 text-slate-900" : "text-slate-600"}`}
          type="button"
          title="List"
          onClick={() => patchData({list: !data.list})}
        >
          List
        </button>
      </div>

      <div className={`overflow-hidden rounded-xl border shadow-sm ring-0 transition focus-within:ring-2 ${noteColorClassMap[color]}`}>
        {data.list ? (
          <div className="relative">
            <div className={`pointer-events-none absolute left-6 top-5 whitespace-pre-line text-slate-500 ${fontSizeClassMap[fontSize]}`}>
              {content.split("\n").map((line) => line.trim() ? `•\n` : "\n").join("")}
            </div>
            <div className="pl-5">{editor}</div>
          </div>
        ) : editor}

        {data.author || data.link?.trim() ? (
          <div className="flex items-center justify-between gap-3 px-6 pb-5 text-sm font-semibold text-slate-500">
            <span>{data.author}</span>
            {data.link?.trim() ? (
              <a
                className="nodrag nopan max-w-[220px] truncate text-blue-600 underline-offset-2 hover:underline"
                href={data.link.trim()}
                target="_blank"
                rel="noreferrer"
              >
                {data.link.trim()}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
