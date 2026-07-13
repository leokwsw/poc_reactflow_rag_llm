import { BadRequestException, Body, Controller, Post } from '@nestjs/common'

import { saveRagFeedback } from '@/app/lib/rag-feedback'

@Controller('rag')
export class RagController {
  @Post('feedback')
  async feedback(@Body() body: Record<string, unknown>) {
    const datasetId = String(body.dataset_id ?? '').trim()
    const query = String(body.query ?? '').trim()
    const rating = body.rating === 'positive' || body.rating === 'negative' ? body.rating : null
    if (!datasetId) throw new BadRequestException('dataset_id is required.')
    if (!query) throw new BadRequestException('query is required.')
    if (!rating) throw new BadRequestException('rating must be positive or negative.')
    const result = await saveRagFeedback({
      dataset_id: datasetId,
      chunk_id: typeof body.chunk_id === 'string' ? body.chunk_id : undefined,
      query,
      rating,
      note: typeof body.note === 'string' ? body.note : undefined,
    })
    return { success: true, ...result }
  }
}
