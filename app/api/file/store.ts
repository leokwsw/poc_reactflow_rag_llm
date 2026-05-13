import {randomUUID} from "node:crypto";
import {deleteR2Object, getR2Object, putR2Object} from "@/app/lib/r2";

export type StoredFileMeta = {
  id: string;
  file_name: string;
  file_size: number;
  mime: string;
};

const blobKey = (id: string) => `staging/${id}/blob`;
const metaKey = (id: string) => `staging/${id}/meta.json`;

export async function saveUpload(file: File): Promise<StoredFileMeta> {
  const id = randomUUID();
  const buffer = Buffer.from(await file.arrayBuffer());
  const meta: StoredFileMeta = {
    id,
    file_name: file.name || "upload",
    file_size: buffer.length,
    mime: file.type || "application/octet-stream",
  };
  await putR2Object(blobKey(id), buffer, meta.mime);
  await putR2Object(metaKey(id), Buffer.from(JSON.stringify(meta), "utf8"), "application/json");
  return meta;
}

export async function readMeta(id: string): Promise<StoredFileMeta | null> {
  try {
    const raw = await getR2Object(metaKey(id));
    return JSON.parse(raw.toString("utf8")) as StoredFileMeta;
  } catch {
    return null;
  }
}

export async function readBlob(id: string): Promise<Buffer | null> {
  try {
    return await getR2Object(blobKey(id));
  } catch {
    return null;
  }
}

const uploadIdRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUploadId(id: string): boolean {
  return typeof id === "string" && uploadIdRe.test(id);
}

export async function removeUpload(id: string): Promise<void> {
  await Promise.all([deleteR2Object(blobKey(id)).catch(() => {}), deleteR2Object(metaKey(id)).catch(() => {})]);
}
