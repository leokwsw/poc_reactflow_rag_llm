import { BadRequestException, Body, Controller, Delete, Get, NotFoundException, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import path from 'node:path'

import {
  deleteDataset,
  getChunksForDocument,
  getDatasetById,
  getDatasets,
  getDatasetStats,
  getDocumentById,
  getDocumentsForDataset,
} from '@/app/datasets/data'

import { DatasetCreationService } from './dataset-creation.service'
import { storeUpload } from './upload-store'

const allowedExtensions = new Set(['.pdf', '.txt', '.rtx', '.rtf', '.html', '.htm', '.csv', '.xlsx', '.doc', '.docx', '.ppt', '.pptx'])
const maxFileSize = 20 * 1024 * 1024

@Controller('datasets')
export class DatasetsController {
  constructor(private readonly creationService: DatasetCreationService) {}

  @Get()
  async list() {
    const datasets = await getDatasets()
    return {
      datasets: await Promise.all(datasets.map(async dataset => ({
        ...dataset,
        stats: await getDatasetStats(dataset),
      }))),
    }
  }

  @Post()
  create(@Body() body: Record<string, unknown>) {
    return this.creationService.create(body)
  }

  @Post('uploads')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: maxFileSize } }))
  async upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file?.size) throw new BadRequestException('Expected a non-empty file field.')
    if (!allowedExtensions.has(path.extname(file.originalname).toLowerCase())) {
      throw new BadRequestException(`${file.originalname} is not an accepted file type.`)
    }
    return storeUpload(file)
  }

  @Get(':datasetId')
  async get(@Param('datasetId') id: string) {
    const dataset = await getDatasetById(id)
    if (!dataset) throw new NotFoundException('Dataset not found.')
    const documents = await getDocumentsForDataset(id)
    return {
      dataset,
      documents: await Promise.all(documents.map(async document => ({
        ...document,
        chunkCount: (await getChunksForDocument(document.id)).length,
      }))),
      stats: await getDatasetStats(dataset),
    }
  }

  @Get(':datasetId/documents/:documentId')
  async document(@Param('datasetId') datasetId: string, @Param('documentId') documentId: string) {
    const [dataset, document] = await Promise.all([
      getDatasetById(datasetId),
      getDocumentById(documentId),
    ])
    if (!dataset || !document || document.dataset_id !== datasetId) {
      throw new NotFoundException('Dataset document not found.')
    }
    return { dataset, document, chunks: await getChunksForDocument(documentId) }
  }

  @Delete(':datasetId')
  async remove(@Param('datasetId') id: string) {
    if (!(await deleteDataset(id))) throw new NotFoundException('Dataset not found.')
    return { success: true }
  }
}
