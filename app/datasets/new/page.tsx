"use client";

import Link from "next/link";
import {useCallback, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent} from "react";
import {allowedExtensions, maxFileSize} from "@/app/api/file/upload-limits";
import type {UploadFileRef} from "@/app/datasets/upload-file-ref";

const acceptedFileTypes = ".pdf,.txt,.rtx,.rtf,.html,.csv,.xls,.xlsx,.doc,.docx,.ppt,.pptx";

const extOf = (name: string) => {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
};

const fileKey = (f: File) => `${f.name}\0${f.size}\0${f.lastModified}`;

const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

export default function NewDatasetPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "uploading" | "creating">("idle");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [pickHint, setPickHint] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);

  const mergeIncoming = useCallback((incoming: File[]) => {
    let skippedInvalid = 0;
    const accepted: File[] = [];
    for (const f of incoming) {
      const ext = extOf(f.name);
      if (!allowedExtensions.has(ext) || f.size === 0 || f.size > maxFileSize) {
        skippedInvalid++;
        continue;
      }
      accepted.push(f);
    }

    setSelectedFiles((prev) => {
      const keys = new Set(prev.map(fileKey));
      const next = [...prev];
      for (const f of accepted) {
        const k = fileKey(f);
        if (keys.has(k)) continue;
        keys.add(k);
        next.push(f);
      }
      return next;
    });

    if (skippedInvalid > 0) {
      setPickHint(`${skippedInvalid} file(s) skipped (type not allowed or over 20 MB).`);
    } else {
      setPickHint(null);
    }
  }, []);

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (list?.length) {
      mergeIncoming(Array.from(list));
    }
    e.target.value = "";
  };

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    setDragOver(true);
  };

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setDragOver(false);
    }
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setDragOver(false);
    const list = e.dataTransfer.files;
    if (list?.length) {
      mergeIncoming(Array.from(list));
    }
  };

  const removeAt = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPickHint(null);
  };

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!title) {
      setError("Dataset name is required.");
      return;
    }

    if (selectedFiles.length === 0) {
      setError("Add at least one file (choose or drag files here).");
      return;
    }

    setError(null);
    setBusy(true);
    const stagedFiles: UploadFileRef[] = [];

    try {
      setPhase("uploading");
      for (const file of selectedFiles) {
        const body = new FormData();
        body.set("file", file);
        const res = await fetch("/api/file/upload", {method: "POST", body});
        const payload = (await res.json().catch(() => ({}))) as {
          error?: string;
          id?: string;
          file_name?: string;
          file_size?: number;
          mime?: string;
        };
        if (!res.ok) {
          throw new Error(payload.error ?? `Upload failed for “${file.name}” (${res.status}).`);
        }
        if (
          typeof payload.id !== "string" ||
          typeof payload.file_name !== "string" ||
          typeof payload.file_size !== "number" ||
          typeof payload.mime !== "string"
        ) {
          throw new Error(`Upload response missing fields for “${file.name}”.`);
        }
        stagedFiles.push({
          id: payload.id,
          file_name: payload.file_name,
          file_size: payload.file_size,
          mime: payload.mime,
        });
      }

      setPhase("creating");
      const res = await fetch("/api/datasets", {
        method: "POST",
        headers: {"Content-Type": "application/json", Accept: "application/json"},
        body: JSON.stringify({title, description, files: stagedFiles}),
      });
      const payload = (await res.json().catch(() => ({}))) as {error?: string; redirect_url?: string};

      if (!res.ok) {
        throw new Error(payload.error ?? `Could not create dataset (${res.status}).`);
      }

      const next = payload.redirect_url ?? "/datasets";
      window.location.assign(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
      setPhase("idle");
    }
  }

  return (
    <div className="min-h-full bg-[#f5f7fb] px-6 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <div>
          <Link className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900" href="/datasets">
            Datasets
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950">New Dataset</h1>
        </div>

        <form className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm" onSubmit={onSubmit}>
          <div className="grid gap-5">
            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-800">Dataset Name</span>
              <input
                className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                name="title"
                placeholder="e.g. Customer Support Handbook"
                required
                type="text"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-800">Description</span>
              <textarea
                className="min-h-24 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                name="description"
                placeholder="What should this dataset be used for?"
              />
            </label>

            <div className="grid gap-2">
              <span className="text-sm font-medium text-zinc-800">Files</span>
              <input
                ref={fileInputRef}
                accept={acceptedFileTypes}
                className="sr-only"
                disabled={busy}
                multiple
                onChange={onFileInputChange}
                type="file"
              />
              <div
                className={`flex min-h-[140px] cursor-default flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-6 text-center text-sm transition ${
                  dragOver
                    ? "border-indigo-400 bg-indigo-50 text-indigo-900"
                    : "border-zinc-300 bg-zinc-50 text-zinc-600"
                } ${busy ? "pointer-events-none opacity-60" : ""}`}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDragOver={onDragOver}
                onDrop={onDrop}
              >
                <p>
                  {dragOver
                    ? "Drop files to add them"
                    : "Drag files here, or choose files — multi-select in the dialog (Shift-click or Ctrl / ⌘-click)."}
                </p>
                <button
                  className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50"
                  disabled={busy}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Choose files…
                </button>
              </div>

              {selectedFiles.length > 0 ? (
                <ul className="mt-1 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
                  {selectedFiles.map((f, i) => (
                    <li
                      key={fileKey(f)}
                      className="flex items-center justify-between gap-3 px-3 py-2 text-sm text-zinc-800"
                    >
                      <span className="min-w-0 truncate" title={f.name}>
                        {f.name}
                        <span className="ml-2 text-zinc-500">({formatBytes(f.size)})</span>
                      </span>
                      <button
                        className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
                        disabled={busy}
                        type="button"
                        onClick={() => removeAt(i)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {pickHint ? <p className="text-xs text-amber-700">{pickHint}</p> : null}
              <span className="text-xs text-zinc-500">PDF, TXT, RTX, HTML, CSV, XLS, XLSX, DOC, DOCX, PPT, PPTX · max 20 MB each</span>
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex justify-end gap-3">
            <Link
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              href="/datasets"
            >
              Cancel
            </Link>
            <button
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={busy}
              type="submit"
            >
              {phase === "uploading" ? "Uploading files…" : phase === "creating" ? "Creating dataset…" : "Upload and Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
