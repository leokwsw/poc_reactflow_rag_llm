import { Module } from '@nestjs/common'
import { WorkflowApiKeysController } from './workflow-api-keys.controller'
import { WorkflowApiKeysService } from './workflow-api-keys.service'

@Module({ controllers: [WorkflowApiKeysController], providers: [WorkflowApiKeysService] })
export class WorkflowApiKeysModule {}
