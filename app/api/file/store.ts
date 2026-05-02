import fs from "node:fs/promises";
import path from "node:path";
import {randomUUID} from "node:crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "data", "file-uploads");

export type StoredFileMeta = {
  id: string;
  file_name: string;
  file_size: number;
  mime: string;
};

const blobPath = (id: string) => path.join(UPLOAD_ROOT, id);
const metaPath = (id: string) => path.join(UPLOAD_ROOT, `${id}.meta.json`);

async function ensureDir() {
  await fs.mkdir(UPLOAD_ROOT, {recursive: true});
}

export async function saveUpload(file: File): Promise<StoredFileMeta> {
  await ensureDir();
  const id = randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());
  const meta: StoredFileMeta = {
    id,
    file_name: file.name || "upload",
    file_size: buffer.length,
    mime: file.type || "application/octet-stream",
  };
  await fs.writeFile(blobPath(id), buffer);
  await fs.writeFile(metaPath(id), JSON.stringify(meta), "utf8");
  return meta;
}

export async function readMeta(id: string): Promise<StoredFileMeta | null> {
  try {
    const raw = await fs.readFile(metaPath(id), "utf8");
    return JSON.parse(raw) as StoredFileMeta;
  } catch {
    return null;
  }
}

export async function readBlob(id: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(blobPath(id));
  } catch {
    return null;
  }
}

const uploadIdRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUploadId(id: string): boolean {
  return typeof id === "string" && uploadIdRe.test(id);
}

export async function removeUpload(id: string): Promise<void> {
  await Promise.all([fs.unlink(blobPath(id)).catch(() => {}), fs.unlink(metaPath(id)).catch(() => {})]);
}
