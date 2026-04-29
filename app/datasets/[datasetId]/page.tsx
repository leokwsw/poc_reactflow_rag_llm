import Link from "next/link";
import {notFound} from "next/navigation";
import {
  documentGridColumns,
  formatDate,
  formatFileSize,
  getChunksForDocument,
  getDatasetById,
  getDatasets,
  getDocumentsForDataset,
} from "@/app/datasets/data";

type DatasetDetailsPageProps = {
  params: Promise<{
    datasetId: string;
  }>;
};

export function generateStaticParams() {
  return getDatasets().map((dataset) => ({
    datasetId: dataset.id,
  }));
}

export const dynamic = "force-dynamic";

export default async function DatasetDetailsPage({params}: DatasetDetailsPageProps) {
  const {datasetId} = await params;
  const dataset = getDatasetById(datasetId);

  if (!dataset) {
    notFound();
  }

  const documents = getDocumentsForDataset(dataset.id).map((document) => ({
    ...document,
    chunkCount: getChunksForDocument(document.id).length,
  }));

  return (
    <div className="min-h-full bg-[#f5f7fb] px-6 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link className="text-sm font-medium text-zinc-500 transition hover:text-zinc-900" href="/datasets">
              Datasets
            </Link>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-950">{dataset.title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-600">{dataset.description}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 shadow-sm">
            {documents.length} files
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              <div
                className="grid border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500"
                style={{gridTemplateColumns: documentGridColumns}}
              >
                <span>File</span>
                <span>Chunks</span>
                <span>Size</span>
                <span>Uploaded</span>
                <span>Status</span>
              </div>
              <div className="divide-y divide-zinc-100">
                {documents.map((document) => (
                  <Link
                    className="grid items-center gap-4 px-4 py-4 transition hover:bg-zinc-50"
                    href={`/datasets/${dataset.id}/files/${document.id}`}
                    key={document.id}
                    style={{gridTemplateColumns: documentGridColumns}}
                  >
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-zinc-950">{document.file_name}</h2>
                      <p className="mt-1 text-sm text-zinc-600">{document.mime_type || "Unknown MIME type"}</p>
                      <p className="mt-1 text-xs text-zinc-500">{document.storage_page}</p>
                    </div>
                    <div className="text-sm text-zinc-700">{document.chunkCount}</div>
                    <div className="text-sm text-zinc-600">{formatFileSize(document.file_size)}</div>
                    <div className="text-sm text-zinc-600">{formatDate(document.uploaded_time)}</div>
                    <div>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          ["indexed", "ready"].includes(document.status)
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                            : document.status === "failed"
                              ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                              : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                        }`}
                      >
                        {document.status}
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
