import Link from "next/link";
import {notFound} from "next/navigation";
import {
  chunkGridColumns,
  formatDate,
  formatFileSize,
  getChunksForDocument,
  getDatasetById,
  getDocumentById,
  getDocuments,
} from "@/app/datasets/data";

type FileDetailsPageProps = {
  params: Promise<{
    datasetId: string;
    fileId: string;
  }>;
};

export function generateStaticParams() {
  return getDocuments().map((document) => ({
    datasetId: document.dataset_id,
    fileId: document.id,
  }));
}

export const dynamic = "force-dynamic";

export default async function FileDetailsPage({params}: FileDetailsPageProps) {
  const {datasetId, fileId} = await params;
  const dataset = getDatasetById(datasetId);
  const document = getDocumentById(fileId);

  if (!dataset || !document || document.dataset_id !== dataset.id) {
    notFound();
  }

  const chunks = getChunksForDocument(document.id);

  return (
    <div className="min-h-full bg-[#f5f7fb] px-6 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-500">
              <Link className="transition hover:text-zinc-900" href="/datasets">
                Datasets
              </Link>
              <span>/</span>
              <Link className="transition hover:text-zinc-900" href={`/datasets/${dataset.id}`}>
                {dataset.title}
              </Link>
            </div>
            <h1 className="mt-2 text-2xl font-semibold text-zinc-950">{document.file_name}</h1>
            <p className="mt-2 max-w-3xl text-sm text-zinc-600">
              {formatFileSize(document.file_size)} · {document.mime_type || "Unknown MIME type"} · Uploaded{" "}
              {formatDate(document.uploaded_time)}
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 shadow-sm">
            {chunks.length} chunks
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[950px]">
              <div
                className="grid border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500"
                style={{gridTemplateColumns: chunkGridColumns}}
              >
                <span>Position</span>
                <span>Text</span>
                <span>Section</span>
                <span>Search ID</span>
              </div>
              <div className="divide-y divide-zinc-100">
                {chunks.map((chunk) => (
                  <article
                    className="grid items-start gap-4 px-4 py-4"
                    key={chunk.id}
                    style={{gridTemplateColumns: chunkGridColumns}}
                  >
                    <div className="text-sm text-zinc-700">{chunk.position}</div>
                    <p className="text-sm leading-6 text-zinc-700">{chunk.text}</p>
                    <div className="text-sm text-zinc-600">
                      {chunk.metadata.section}
                      <div className="mt-1 text-xs text-zinc-500">Page {chunk.metadata.page}</div>
                    </div>
                    <div className="break-all text-xs text-zinc-500">{chunk.es_document_id}</div>
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
