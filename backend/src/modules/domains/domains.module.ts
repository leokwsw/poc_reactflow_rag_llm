import { Module } from '@nestjs/common'

import { ConversationsController } from './conversations.controller'
import { DatasetsController } from './datasets.controller'
import { McpController } from './mcp.controller'
import { ModelsController } from './models.controller'
import { ToolsController } from './tools.controller'
import { WorkflowsController } from './workflows.controller'
import { DatasetCreationService } from './dataset-creation.service'
import { RagController } from './rag.controller'

@Module({
  controllers: [
    WorkflowsController,
    ConversationsController,
    ModelsController,
    McpController,
    ToolsController,
    DatasetsController,
    RagController,
  ],
  providers: [DatasetCreationService],
})
export class DomainsModule {}
