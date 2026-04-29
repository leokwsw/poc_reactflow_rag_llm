const datasets = [
  {
    name: "Mac MLX ASR Guide",
    description: "Learning materials and reference files for a Mac MLX speech recognition workflow.",
    documents: 4,
    updatedAt: "2026-04-29",
    status: "Ready",
  },
  {
    name: "Workflow Knowledge Base",
    description: "Example source documents for testing retrieval, classification, and generation nodes.",
    documents: 8,
    updatedAt: "2026-04-29",
    status: "Ready",
  },
  {
    name: "Uploaded Files",
    description: "Files attached during workflow runs and prepared for future dataset ingestion.",
    documents: 0,
    updatedAt: "Not synced",
    status: "Draft",
  },
];

export default function DatasetsPage() {
  return (
    <div className="min-h-full bg-[#f5f7fb] px-6 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Knowledge</p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-950">Datasets</h1>
          </div>
          <button
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
            type="button"
          >
            New Dataset
          </button>
        </div>

        <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[1fr_120px_140px_120px] border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
                <span>Name</span>
                <span>Documents</span>
                <span>Updated</span>
                <span>Status</span>
              </div>
              <div className="divide-y divide-zinc-100">
                {datasets.map((dataset) => (
                  <article
                    className="grid grid-cols-[1fr_120px_140px_120px] items-center gap-4 px-4 py-4 transition hover:bg-zinc-50"
                    key={dataset.name}
                  >
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-zinc-950">{dataset.name}</h2>
                      <p className="mt-1 max-w-2xl text-sm text-zinc-600">{dataset.description}</p>
                    </div>
                    <div className="text-sm text-zinc-700">{dataset.documents}</div>
                    <div className="text-sm text-zinc-600">{dataset.updatedAt}</div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          dataset.status === "Ready"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                        }`}
                      >
                        {dataset.status}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
