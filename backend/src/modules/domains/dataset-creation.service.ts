import { BadRequestException, Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

import { mergeModelConfig, mergeRerankingConfig } from '@/app/datasets/config'
import { createDatasetWithDocuments, dataPath } from '@/app/datasets/data'
import { createTaskId, enqueueDatasetTask } from '@/app/datasets/queue'
import { prepareDatasetSource, type DatasetSourceInput } from '@/app/lib/multimodal-sources'

import { readUpload, removeUpload, type StoredUpload } from './upload-store'

type CreateDatasetBody = {
  title?: unknown
  description?: unknown
  files?: unknown
  sources?: unknown
  embedding_config?: unknown
  reranking_config?: unknown
  chunk_config?: unknown
}

type PreparedFile = {
  displayName: string
  size: number
  mime: string
  extension: string
  bytes: Buffer
  stagingId?: string
  sourceType?: string
}

@Injectable()
export class DatasetCreationService {
  async create(body: CreateDatasetBody) {
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''
    const files = Array.isArray(body.files) ? body.files : []
    const sources = Array.isArray(body.sources) ? body.sources : []
    if (!title) throw new BadRequestException('Dataset title is required.')
    if (!files.length && !sources.length) throw new BadRequestException('files or sources must be a non-empty array.')
    if (!files.every(this.isUploadRef)) throw new BadRequestException('Invalid staged file metadata.')
    if (!sources.every(this.isSource)) throw new BadRequestException('Invalid dataset source.')

    const prepared: PreparedFile[] = []
    for (const reference of files as StoredUpload[]) {
      const stored = await readUpload(reference.id)
      if (!stored || JSON.stringify(stored.metadata) !== JSON.stringify(reference)) {
        throw new BadRequestException(`Missing or mismatched staged upload ${reference.id}.`)
      }
      prepared.push({
        displayName: reference.file_name,
        size: stored.bytes.length,
        mime: reference.mime,
        extension: path.extname(reference.file_name).toLowerCase(),
        bytes: stored.bytes,
        stagingId: reference.id,
      })
    }
    for (const source of sources as DatasetSourceInput[]) {
      const item = await prepareDatasetSource(source)
      prepared.push({
        displayName: item.displayName,
        size: item.bytes.length,
        mime: item.mime,
        extension: item.extension,
        bytes: item.bytes,
        sourceType: item.sourceType,
      })
    }

    const now = new Date().toISOString()
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)
    const datasetId = `dataset-${slug || 'upload'}-${randomUUID().slice(0, 8)}`
    const directory = dataPath('uploads', datasetId)
    await fs.mkdir(directory, { recursive: true })
    const chunkConfig = this.parseChunkConfig(body.chunk_config)
    const embeddingConfig = mergeModelConfig(body.embedding_config)
    const rerankingConfig = body.reranking_config === undefined
      ? { ...embeddingConfig, top_k: 3, score: 0.5 }
      : mergeRerankingConfig(body.reranking_config)
    const documents = []
    const documentIds: string[] = []
    const filePaths: string[] = []
    for (const item of prepared) {
      const id = `file-${randomUUID()}`
      const safeName = item.displayName.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'upload'
      const relativePath = path.join('uploads', datasetId, `${id}-${safeName}`)
      const filePath = dataPath(relativePath)
      await fs.writeFile(filePath, item.bytes)
      if (item.stagingId) await removeUpload(item.stagingId)
      documentIds.push(id)
      filePaths.push(filePath)
      documents.push({
        id,
        file_name: item.displayName,
        dataset_id: datasetId,
        file_size: item.size,
        created_at: now,
        updated_time: now,
        uploaded_time: now,
        deleted: 'false',
        deleted_at: '',
        upload_source: item.sourceType ?? 'file',
        mime_type: item.mime,
        ext: item.extension,
        storage_page: relativePath,
        status: 'queued',
        enabled: true,
      })
    }
    await createDatasetWithDocuments({
      id: datasetId,
      title,
      description,
      created_at: now,
      updated_at: now,
      embedding_config: embeddingConfig,
      reranking_config: rerankingConfig,
      chunk_config: chunkConfig,
      language_hint: 'chinese',
      separators: '\n\n',
      keep_separators: true,
    }, documents)
    await enqueueDatasetTask({
      id: createTaskId(),
      dataset_id: datasetId,
      document_ids: documentIds,
      file_paths: filePaths,
    })
    return {
      dataset_id: datasetId,
      document_ids: documentIds,
      redirect_url: `/datasets/${datasetId}`,
      task_status: 'queued',
    }
  }

  private readonly isUploadRef = (value: unknown): value is StoredUpload => {
    if (!value || typeof value !== 'object') return false
    const item = value as Record<string, unknown>
    return typeof item.id === 'string' && typeof item.file_name === 'string' &&
      typeof item.file_size === 'number' && typeof item.mime === 'string'
  }

  private readonly isSource = (value: unknown): value is DatasetSourceInput => {
    if (!value || typeof value !== 'object') return false
    const item = value as Record<string, unknown>
    return typeof item.type === 'string' &&
      (typeof item.url === 'string' || typeof item.text === 'string' || typeof item.notion_page_id === 'string')
  }

  private parseChunkConfig(raw: unknown) {
    if (raw === undefined) return { chunk_size: 1024, chunk_overlap: 50 }
    if (!raw || typeof raw !== 'object') throw new BadRequestException('Invalid chunk_config.')
    const value = raw as Record<string, unknown>
    const size = Number(value.chunk_size_words)
    const overlap = Number(value.overlap_words)
    if (!Number.isFinite(size) || !Number.isFinite(overlap) || size < 10 || size > 50_000 || overlap < 0 || overlap >= size) {
      throw new BadRequestException('chunk_size_words must be 10–50000 and overlap_words must be lower than chunk size.')
    }
    return { chunk_size: Math.floor(size), chunk_overlap: Math.floor(overlap) }
  }
}
