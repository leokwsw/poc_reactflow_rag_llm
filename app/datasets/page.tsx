import Link from "next/link";
import {revalidatePath} from "next/cache";
import ConfirmSubmitButton from "@/app/components/confirm-submit-button";
import {deleteDataset, formatDate, formatFileSize, getDatasets, getDatasetStats} from "@/app/datasets/data";

export const dynamic = "force-dynamic";

export default async function DatasetsPage() {
  const rawDatasets = await getDatasets();
  const datasets = await Promise.all(rawDatasets.map(async (dataset) => ({
    ...dataset,
    stats: await getDatasetStats(dataset),
  })));

  async function deleteDatasetAction(formData: FormData) {
    "use server";
    const datasetId = String(formData.get("dataset_id") ?? "");
    await deleteDataset(datasetId);
    revalidatePath("/datasets");
  }

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

        {datasets.length > 0 ? (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {datasets.map((dataset) => (
              <article
                className="group flex min-h-[300px] flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                key={dataset.id}
              >
                <Link className="min-w-0" href={`/datasets/${dataset.id}`}>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="min-w-0 truncate text-base font-semibold text-zinc-950 group-hover:text-zinc-700">
                        {dataset.title}
                      </h2>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
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
                    <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{dataset.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                      <span className="rounded-full bg-zinc-100 px-2 py-1">Embedding {dataset.embedding_config.model}</span>
                      <span className="rounded-full bg-zinc-100 px-2 py-1">Top {dataset.reranking_config.top_k}</span>
                      <span className="rounded-full bg-zinc-100 px-2 py-1">Score {dataset.reranking_config.score}</span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4 sm:grid-cols-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Docs</p>
                      <p className="mt-1 text-sm font-medium text-zinc-800">{dataset.stats.documentCount}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Chunks</p>
                      <p className="mt-1 text-sm font-medium text-zinc-800">{dataset.stats.chunkCount}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Size</p>
                      <p className="mt-1 text-sm font-medium text-zinc-800">{formatFileSize(dataset.stats.totalSize)}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Updated</p>
                      <p className="mt-1 text-sm font-medium text-zinc-800">{formatDate(dataset.updated_at)}</p>
                    </div>
                  </div>
                </Link>

                <form action={deleteDatasetAction} className="mt-4 border-t border-zinc-100 pt-3">
                  <input name="dataset_id" type="hidden" value={dataset.id} />
                  <ConfirmSubmitButton
                    className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100"
                    message={`Delete dataset "${dataset.title}"? This will remove its documents and chunks.`}
                  >
                    Delete Dataset
                  </ConfirmSubmitButton>
                </form>
              </article>
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center shadow-sm">
            <h2 className="text-base font-semibold text-zinc-950">No datasets yet</h2>
            <p className="mt-2 text-sm text-zinc-500">Create a dataset to start adding knowledge files.</p>
          </section>
        )}
      </div>
    </div>
  );
}
