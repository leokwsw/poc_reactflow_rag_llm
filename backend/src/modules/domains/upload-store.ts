import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

export type StoredUpload = {
  id: string
  file_name: string
  file_size: number
  mime: string
}

const root = path.join(process.cwd(), 'data', 'staged-uploads')
const idPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const blobPath = (id: string) => path.join(root, id)
const metaPath = (id: string) => path.join(root, `${id}.meta.json`)

export async function storeUpload(file: Express.Multer.File): Promise<StoredUpload> {
  await fs.mkdir(root, { recursive: true })
  const upload = {
    id: randomUUID(),
    file_name: file.originalname || 'upload',
    file_size: file.size,
    mime: file.mimetype || 'application/octet-stream',
  }
  await Promise.all([
    fs.writeFile(blobPath(upload.id), file.buffer),
    fs.writeFile(metaPath(upload.id), JSON.stringify(upload), 'utf8'),
  ])
  return upload
}

export async function readUpload(id: string) {
  if (!idPattern.test(id)) return null
  try {
    const [metadata, bytes] = await Promise.all([
      fs.readFile(metaPath(id), 'utf8'),
      fs.readFile(blobPath(id)),
    ])
    return { metadata: JSON.parse(metadata) as StoredUpload, bytes }
  } catch {
    return null
  }
}

export async function removeUpload(id: string) {
  await Promise.all([
    fs.unlink(blobPath(id)).catch(() => undefined),
    fs.unlink(metaPath(id)).catch(() => undefined),
  ])
}
