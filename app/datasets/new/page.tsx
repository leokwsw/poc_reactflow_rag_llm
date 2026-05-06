"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent} from "react";
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

type Step = 1 | 2 | 3;

export default function NewDatasetPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [chunkSizeWords, setChunkSizeWords] = useState(120);
  const [overlapWords, setOverlapWords] = useState(20);

  const [embedApiBaseUrl, setEmbedApiBaseUrl] = useState("https://omlx-server.octopus-tech.com/v1");
  const [embedApiKey, setEmbedApiKey] = useState("octopusPass");
  const [embedModel, setEmbedModel] = useState("bge-mn3-mlx-fp16");

  const [rerankApiBaseUrl, setRerankApiBaseUrl] = useState("https://omlx-server.octopus-tech.com/v1");
  const [rerankApiKey, setRerankApiKey] = useState("octopusPass");
  const [rerankModel, setRerankModel] = useState("Qwen3-Reranker-0.5B-mxfp8");
  const [rerankTopK, setRerankTopK] = useState(3);
  const [rerankScore, setRerankScore] = useState(0.5);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "uploading" | "creating">("idle");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [pickHint, setPickHint] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);

  useEffect(() => {
    if (step !== 3 || !redirectUrl) return;
    const id = window.setTimeout(() => {
      router.push(redirectUrl);
    }, 3000);
    return () => window.clearTimeout(id);
  }, [step, redirectUrl, router]);

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

  const goStep2 = () => {
    setError(null);
    if (!title.trim()) {
      setError("Dataset name is required.");
      return;
    }
    if (selectedFiles.length === 0) {
      setError("Add at least one file.");
      return;
    }
    setStep(2);
  };

  const copyEmbeddingToRerank = () => {
    setRerankApiBaseUrl(embedApiBaseUrl);
    setRerankApiKey(embedApiKey);
    setRerankModel(embedModel);
  };

  const startIngestion = async () => {
    setError(null);
    const cs = Math.floor(Number(chunkSizeWords));
    const ov = Math.floor(Number(overlapWords));
    if (!Number.isFinite(cs) || cs < 10 || cs > 50_000) {
      setError("Chunk size must be between 10 and 50000 words.");
      return;
    }
    if (!Number.isFinite(ov) || ov < 0 || ov >= cs) {
      setError("Overlap must be at least 0 and smaller than chunk size.");
      return;
    }

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
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          files: stagedFiles,
          chunk_config: {chunk_size_words: cs, overlap_words: ov},
          embedding_config: {
            apiBaseUrl: embedApiBaseUrl.trim(),
            apiKey: embedApiKey.trim(),
            model: embedModel.trim(),
          },
          reranking_config: {
            apiBaseUrl: rerankApiBaseUrl.trim(),
            apiKey: rerankApiKey.trim(),
            model: rerankModel.trim(),
            top_k: Math.max(1, Math.floor(Number(rerankTopK))),
            score: Math.min(1, Math.max(0, Number(rerankScore))),
          },
        }),
      });
      const payload = (await res.json().catch(() => ({}))) as {error?: string; redirect_url?: string};

      if (!res.ok) {
        throw new Error(payload.error ?? `Could not create dataset (${res.status}).`);
      }

      const next = payload.redirect_url ?? "/datasets";
      setRedirectUrl(next);
      setStep(3);
      setBusy(false);
      setPhase("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setBusy(false);
      setPhase("idle");
    }
  };

  const stepCircle = (n: Step, label: string) => (
    <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
          step >= n ? "bg-indigo-600 text-white" : "bg-zinc-200 text-zinc-600"
        }`}
      >
        {n}
      </span>
      <span className={`text-xs font-medium ${step >= n ? "text-zinc-900" : "text-zinc-500"}`}>{label}</span>
    </div>
  );

  return (
    <div className="min-h-full bg-[#f5f7fb] px-6 py-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-5">
        <div>
          <Link className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900" href="/datasets">
            Datasets
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950">New Dataset</h1>
        </div>

        <div className="flex items-start gap-2 rounded-2xl border border-zinc-200/80 bg-white px-4 py-4 shadow-sm">
          {stepCircle(1, "Upload")}
          <div className="mt-4 h-px flex-1 bg-zinc-200" />
          {stepCircle(2, "Chunk & models")}
          <div className="mt-4 h-px flex-1 bg-zinc-200" />
          {stepCircle(3, "Started")}
        </div>

        {step === 1 ? (
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900">Step 1 · Dataset & files</h2>
            <p className="mt-1 text-sm text-zinc-600">Title, description, and upload the documents to ingest.</p>

            <div className="mt-5 grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-800">Dataset name</span>
                <input
                  className="rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  placeholder="e.g. Customer Support Handbook"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-zinc-800">Description</span>
                <textarea
                  className="min-h-24 rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  placeholder="What should this dataset be used for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  type="file"
                  onChange={onFileInputChange}
                />
                <div
                  className={`flex min-h-[140px] cursor-default flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-3 py-6 text-center text-sm transition ${
                    dragOver
                      ? "border-indigo-400 bg-indigo-50 text-indigo-900"
                      : "border-zinc-300 bg-zinc-50 text-zinc-600"
                  }`}
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
                <span className="text-xs text-zinc-500">
                  PDF, TXT, RTX, HTML, CSV, XLS, XLSX, DOC, DOCX, PPT, PPTX · max 20 MB each
                </span>
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
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
                type="button"
                onClick={goStep2}
              >
                Continue
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-zinc-900">Step 2 · Chunking & models</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Configure how text is split before embedding, and which models to use for embeddings and reranking.
            </p>

            <div className="mt-5 grid gap-6">
              <fieldset className="grid gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
                <legend className="px-1 text-sm font-semibold text-zinc-800">Chunk config</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-zinc-700">Chunk size (words)</span>
                    <input
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                      min={10}
                      type="number"
                      value={chunkSizeWords}
                      onChange={(e) => setChunkSizeWords(Number(e.target.value))}
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-zinc-700">Overlap (words)</span>
                    <input
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                      min={0}
                      type="number"
                      value={overlapWords}
                      onChange={(e) => setOverlapWords(Number(e.target.value))}
                    />
                  </label>
                </div>
                <p className="text-xs text-zinc-500">Overlap must be smaller than chunk size. Defaults match the previous single-step flow (120 / 20).</p>
              </fieldset>

              <fieldset className="grid gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
                <legend className="px-1 text-sm font-semibold text-zinc-800">Embedding</legend>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-zinc-700">API base URL</span>
                  <input
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    placeholder="https://api.example.com/v1"
                    type="url"
                    value={embedApiBaseUrl}
                    onChange={(e) => setEmbedApiBaseUrl(e.target.value)}
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-zinc-700">API key</span>
                  <input
                    autoComplete="off"
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    placeholder="Optional if using local deterministic embeddings"
                    type="password"
                    value={embedApiKey}
                    onChange={(e) => setEmbedApiKey(e.target.value)}
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-zinc-700">Model</span>
                  <input
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    type="text"
                    value={embedModel}
                    onChange={(e) => setEmbedModel(e.target.value)}
                  />
                </label>
              </fieldset>

              <fieldset className="grid gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
                <legend className="px-1 text-sm font-semibold text-zinc-800">Reranking</legend>
                <button
                  className="w-fit rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                  type="button"
                  onClick={copyEmbeddingToRerank}
                >
                  Copy embedding URL / key / model
                </button>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-zinc-700">API base URL</span>
                  <input
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    placeholder="https://api.example.com/v1"
                    type="url"
                    value={rerankApiBaseUrl}
                    onChange={(e) => setRerankApiBaseUrl(e.target.value)}
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-zinc-700">API key</span>
                  <input
                    autoComplete="off"
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    type="password"
                    value={rerankApiKey}
                    onChange={(e) => setRerankApiKey(e.target.value)}
                  />
                </label>
                <label className="grid gap-1.5">
                  <span className="text-xs font-medium text-zinc-700">Model</span>
                  <input
                    className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    type="text"
                    value={rerankModel}
                    onChange={(e) => setRerankModel(e.target.value)}
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-zinc-700">Top K</span>
                    <input
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                      min={1}
                      type="number"
                      value={rerankTopK}
                      onChange={(e) => setRerankTopK(Number(e.target.value))}
                    />
                  </label>
                  <label className="grid gap-1.5">
                    <span className="text-xs font-medium text-zinc-700">Score threshold (0–1)</span>
                    <input
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                      max={1}
                      min={0}
                      step={0.05}
                      type="number"
                      value={rerankScore}
                      onChange={(e) => setRerankScore(Number(e.target.value))}
                    />
                  </label>
                </div>
              </fieldset>
            </div>

            {error ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Link
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                href="/datasets"
              >
                Cancel
              </Link>
              <button
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                disabled={busy}
                type="button"
                onClick={() => {
                  setError(null);
                  setStep(1);
                }}
              >
                Back
              </button>
              <button
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={busy}
                type="button"
                onClick={() => void startIngestion()}
              >
                {phase === "uploading" ? "Uploading files…" : phase === "creating" ? "Creating dataset…" : "Start ingestion"}
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 && redirectUrl ? (
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-emerald-950">Ingestion task started</h2>
            <p className="mt-2 text-sm text-emerald-900">
              Your dataset was created and background processing has begun. You will be redirected to the dataset detail page in about 3 seconds.
            </p>
            <p className="mt-4 text-sm">
              <Link className="font-medium text-indigo-700 underline-offset-2 hover:underline" href={redirectUrl}>
                Open dataset now
              </Link>
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
