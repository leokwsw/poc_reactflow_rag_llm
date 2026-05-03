import Link from "next/link";
import {datasetGridColumns, formatDate, formatFileSize, getDatasets, getDatasetStats} from "@/app/datasets/data";

export const dynamic = "force-dynamic";

export default function DatasetsPage() {
  const datasets = getDatasets().map((dataset) => ({
    ...dataset,
    stats: getDatasetStats(dataset),
  }));

  return (
    <div className="min-h-full bg-[#f5f7fb] px-6 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Knowledge</p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-950">Datasets</h1>
          </div>
          <Link
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
            href="/datasets/new"
          >
            New Dataset
          </Link>
        </div>

        <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[920px]">
              <div
                className="grid border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500"
                style={{gridTemplateColumns: datasetGridColumns}}
              >
                <span>Name</span>
                <span>Documents</span>
                <span>Chunks</span>
                <span>Size</span>
                <span>Updated</span>
                <span>Status</span>
              </div>
              <div className="divide-y divide-zinc-100">
                {datasets.map((dataset) => (
                  <Link
                    className="grid items-center gap-4 px-4 py-4 transition hover:bg-zinc-50"
                    href={`/datasets/${dataset.id}`}
                    key={dataset.id}
                    style={{gridTemplateColumns: datasetGridColumns}}
                  >
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-zinc-950">{dataset.title}</h2>
                      <p className="mt-1 max-w-2xl text-sm text-zinc-600">{dataset.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                        <div>Embedding Model {dataset.embedding_config.model}</div>
                        <div>Top {dataset.reranking_config.top_k}</div>
                        <div>Score {dataset.reranking_config.score}</div>
                      </div>
                    </div>
                    <div className="text-sm text-zinc-700">{dataset.stats.documentCount}</div>
                    <div className="text-sm text-zinc-700">{dataset.stats.chunkCount}</div>
                    <div className="text-sm text-zinc-600">{formatFileSize(dataset.stats.totalSize)}</div>
                    <div className="text-sm text-zinc-600">{formatDate(dataset.updated_at)}</div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          ["Ready"].includes(dataset.stats.status)
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : dataset.stats.status === "Failed"
                              ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                            : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                        }`}
                      >
                        {dataset.stats.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
