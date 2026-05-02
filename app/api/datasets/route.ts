import fs from "node:fs";
import path from "node:path";
import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {NextResponse} from "next/server";
import {isValidUploadId, readBlob, readMeta, removeUpload} from "@/app/api/file/store";
import {dataPath, getDatasets, getDocuments, readJsonFile, writeJsonFile} from "@/app/datasets/data";
import {createTaskId, enqueueDatasetTask} from "@/app/datasets/queue";
import type {UploadFileRef} from "@/app/datasets/upload-file-ref";

export const runtime = "nodejs";

const safeFileName = (fileName: string) => fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "upload";

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

const badRequest = (message: string) => NextResponse.json({error: message}, {status: 400});

const isUploadFileRef = (value: unknown): value is UploadFileRef => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const o = value as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.file_name === "string" &&
    typeof o.mime === "string" &&
    typeof o.file_size === "number" &&
    Number.isFinite(o.file_size) &&
    o.file_size >= 0
  );
};

type PreparedDatasetFile = {
  displayName: string;
  size: number;
  mime: string;
  extension: string;
  bytes: Buffer;
  stagingId: string;
};

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      {error: "Content-Type must be application/json. Send staged file objects from POST /api/file/upload in a `files` array."},
      {status: 415},
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON body.");
  }

  if (!body || typeof body !== "object") {
    return badRequest("Request body must be a JSON object.");
  }

  const o = body as Record<string, unknown>;
  const title = typeof o.title === "string" ? o.title.trim() : "";
  const description = typeof o.description === "string" ? o.description.trim() : "";
  const fileRefs = o.files;

  if (!title) {
    return badRequest("Dataset title is required.");
  }

  if (!Array.isArray(fileRefs) || fileRefs.length === 0) {
    return badRequest("files must be a non-empty array of objects from the file upload API.");
  }

  if (!fileRefs.every(isUploadFileRef)) {
    return badRequest("Each file entry must include id, file_name, file_size, and mime (upload API response shape).");
  }

  const prepared: PreparedDatasetFile[] = [];

  for (const ref of fileRefs) {
    if (!isValidUploadId(ref.id)) {
      return badRequest(`Invalid file id: ${ref.id}.`);
    }

    const meta = await readMeta(ref.id);
    const bytes = await readBlob(ref.id);
    if (!meta || !bytes) {
      return badRequest(`Missing staged upload for id ${ref.id}. Upload the file first via POST /api/file/upload.`);
    }

    if (meta.id !== ref.id || meta.file_name !== ref.file_name || meta.file_size !== ref.file_size || meta.mime !== ref.mime) {
      return badRequest(`Staged file metadata does not match stored upload for id ${ref.id}.`);
    }

    const extension = path.extname(meta.file_name).toLowerCase();

    prepared.push({
      displayName: meta.file_name,
      size: bytes.length,
      mime: meta.mime,
      extension,
      bytes,
      stagingId: ref.id,
    });
  }

  const timestamp = new Date().toISOString();
  const datasetId = `dataset-${toSlug(title) || "upload"}-${randomUUID().slice(0, 8)}`;
  const uploadDirectory = dataPath("uploads", datasetId);
  fs.mkdirSync(uploadDirectory, {recursive: true});

  const modelBase = readJsonFile("model-base.json", {
    apiBaseUrl: "",
    apiKey: "",
    model: "local-deterministic",
  });
  const documents = getDocuments();
  const documentIds: string[] = [];
  const filePaths: string[] = [];

  for (const item of prepared) {
    const documentId = `file-${randomUUID()}`;
    const storedName = `${documentId}-${safeFileName(item.displayName)}`;
    const relativePath = path.join("uploads", datasetId, storedName);
    const filePath = dataPath(relativePath);

    fs.writeFileSync(filePath, item.bytes);
    await removeUpload(item.stagingId);
    documentIds.push(documentId);
    filePaths.push(filePath);
    documents.push({
      id: documentId,
      file_name: item.displayName,
      dataset_id: datasetId,
      file_size: item.size,
      created_at: timestamp,
      updated_time: timestamp,
      uploaded_time: timestamp,
      deleted: "false",
      deleted_at: "",
      upload_source: "file",
      mime_type: item.mime,
      ext: item.extension,
      storage_page: relativePath,
      status: "queued",
      enabled: true,
    });
  }

  writeJsonFile("0-datasets.json", {
    datasets: [
      ...getDatasets(),
      {
        id: datasetId,
        title,
        description,
        created_at: timestamp,
        updated_at: timestamp,
        embedding_config: modelBase,
        reranking_config: {
          ...modelBase,
          top_k: 3,
          score: 0.5,
        },
      },
    ],
  });
  writeJsonFile("1-documents.json", {documents});

  enqueueDatasetTask({
    id: createTaskId(),
    dataset_id: datasetId,
    document_ids: documentIds,
    file_paths: filePaths,
  });

  revalidatePath("/datasets");
  revalidatePath(`/datasets/${datasetId}`);

  return NextResponse.json({
    dataset_id: datasetId,
    document_ids: documentIds,
    redirect_url: `/datasets/${datasetId}`,
    task_status: "queued",
  });
}
