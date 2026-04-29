import datasetsSource from "@/data/0-datasets.json";
import documentsSource from "@/data/1-documents.json";
import chunksSource from "@/data/2-chunk.json";

type Dataset = (typeof datasetsSource.datasets)[number];

const datasetGridColumns = "minmax(360px, 1fr) 110px 110px 120px 150px 120px";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));

const formatFileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

const getDatasetStats = (dataset: Dataset) => {
  const documents = documentsSource.documents.filter((document) => document.dataset_id === dataset.id && document.enabled);
  const documentIds = new Set(documents.map((document) => document.id));
  const chunks = chunksSource.chunks.filter((chunk) => documentIds.has(chunk.file_id) && chunk.enabled);
  const totalSize = documents.reduce((sum, document) => sum + document.file_size, 0);

  return {
    chunkCount: chunks.length,
    documentCount: documents.length,
    documents,
    status: documents.every((document) => document.status === "indexed") ? "Ready" : "Indexing",
    totalSize,
  };
};

export default function DatasetsPage() {
  const datasets = datasetsSource.datasets.map((dataset) => ({
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
          <button
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
            type="button"
          >
            New Dataset
          </button>
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
                  <article
                    className="grid items-center gap-4 px-4 py-4 transition hover:bg-zinc-50"
                    key={dataset.id}
                    style={{gridTemplateColumns: datasetGridColumns}}
                  >
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-zinc-950">{dataset.title}</h2>
                      <p className="mt-1 max-w-2xl text-sm text-zinc-600">{dataset.description}</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-zinc-500">
                        <span>{dataset.embedding_config.model}</span>
                        <span>Top {dataset.reranking_config.top_k}</span>
                        <span>Score {dataset.reranking_config.score}</span>
                      </div>
                    </div>
                    <div className="text-sm text-zinc-700">{dataset.stats.documentCount}</div>
                    <div className="text-sm text-zinc-700">{dataset.stats.chunkCount}</div>
                    <div className="text-sm text-zinc-600">{formatFileSize(dataset.stats.totalSize)}</div>
                    <div className="text-sm text-zinc-600">{formatDate(dataset.updated_at)}</div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          dataset.stats.status === "Ready"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                        }`}
                      >
                        {dataset.stats.status}
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
