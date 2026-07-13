import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'

import { deleteModelConfig, listModelConfigs, upsertModelConfig, updateModelConfig } from '@/app/model/data'

type ModelBody = {
  id?: string
  label?: string
  api_base_url?: string
  api_key?: string
  model?: string
  model_type?: string
  provider?: string
  sdk?: string
}

@Controller('models')
export class ModelsController {
  @Get()
  async list() {
    return { models: await listModelConfigs() }
  }

  @Post()
  async create(@Body() body: ModelBody) {
    await upsertModelConfig(body.id ?? '', body)
    return { model: (await listModelConfigs()).find(item => item.id === body.id) }
  }

  @Put(':modelId')
  async update(@Param('modelId') id: string, @Body() body: ModelBody) {
    await updateModelConfig(id, body)
    return { model: (await listModelConfigs()).find(item => item.id === id) }
  }

  @Delete(':modelId')
  async remove(@Param('modelId') id: string) {
    await deleteModelConfig(id)
    return { success: true }
  }
}
