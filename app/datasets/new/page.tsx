"use client";

import Link from "next/link";
import {useState, type FormEvent} from "react";
import type {UploadFileRef} from "@/app/datasets/upload-file-ref";

const acceptedFileTypes = ".pdf,.txt,.rtx,.rtf,.html,.csv,.xls,.xlsx,.doc,.docx,.ppt,.pptx";

export default function NewDatasetPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "uploading" | "creating">("idle");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();
    const input = form.elements.namedItem("files");
    const fileInput = input instanceof HTMLInputElement ? input : null;
    const fileList = fileInput?.files;

    if (!title) {
      setError("Dataset name is required.");
      return;
    }

    if (!fileList?.length) {
      setError("Select at least one file.");
      return;
    }

    setError(null);
    setBusy(true);
    const stagedFiles: UploadFileRef[] = [];

    try {
      setPhase("uploading");
      for (const file of Array.from(fileList)) {
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

            <label className="grid gap-2">
              <span className="text-sm font-medium text-zinc-800">Files</span>
              <input
                accept={acceptedFileTypes}
                className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-3 py-6 text-sm text-zinc-600"
                disabled={busy}
                multiple
                name="files"
                required
                type="file"
              />
              <span className="text-xs text-zinc-500">PDF, TXT, RTX, HTML, CSV, XLS, XLSX, DOC, DOCX, PPT, PPTX</span>
            </label>
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
