import fs from "node:fs";
import path from "node:path";
import {randomUUID} from "node:crypto";
import {revalidatePath} from "next/cache";
import {NextResponse} from "next/server";
import {dataPath, getDatasets, getDocuments, readJsonFile, writeJsonFile} from "@/app/datasets/data";
import {createTaskId, enqueueDatasetTask} from "@/app/datasets/queue";

export const runtime = "nodejs";

const maxFiles = 10;
const maxFileSize = 20 * 1024 * 1024;
const allowedExtensions = new Set([
  ".pdf",
  ".txt",
  ".rtx",
  ".rtf",
  ".html",
  ".htm",
  ".csv",
  ".xls",
  ".xlsx",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
]);

const safeFileName = (fileName: string) => fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "upload";

const toSlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

const badRequest = (message: string) => NextResponse.json({error: message}, {status: 400});

export async function POST(request: Request) {
  const wantsJson = request.headers.get("accept")?.includes("application/json") ?? false;
  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const files = formData.getAll("files").filter((value): value is File => value instanceof File && value.size > 0);

  if (!title) {
    return badRequest("Dataset title is required.");
  }

  if (files.length === 0) {
    return badRequest("Select at least one file to upload.");
  }

  if (files.length > maxFiles) {
    return badRequest(`Upload ${maxFiles} files or fewer.`);
  }

  for (const file of files) {
    const extension = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.has(extension)) {
      return badRequest(`${file.name} is not an accepted dataset file type.`);
    }

    if (file.size > maxFileSize) {
      return badRequest(`${file.name} is larger than 20 MB.`);
    }
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

  for (const file of files) {
    const extension = path.extname(file.name).toLowerCase();
    const documentId = `file-${randomUUID()}`;
    const storedName = `${documentId}-${safeFileName(file.name)}`;
    const relativePath = path.join("uploads", datasetId, storedName);
    const filePath = dataPath(relativePath);
    const bytes = Buffer.from(await file.arrayBuffer());

    fs.writeFileSync(filePath, bytes);
    documentIds.push(documentId);
    filePaths.push(filePath);
    documents.push({
      id: documentId,
      file_name: file.name,
      dataset_id: datasetId,
      file_size: file.size,
      created_at: timestamp,
      updated_time: timestamp,
      uploaded_time: timestamp,
      deleted: "false",
      deleted_at: "",
      upload_source: "file",
      mime_type: file.type,
      ext: extension,
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
  if (wantsJson) {
    return NextResponse.json({
      dataset_id: datasetId,
      document_ids: documentIds,
      redirect_url: `/datasets/${datasetId}`,
      task_status: "queued",
    });
  }

  return NextResponse.redirect(new URL(`/datasets/${datasetId}`, request.url), 303);
}
