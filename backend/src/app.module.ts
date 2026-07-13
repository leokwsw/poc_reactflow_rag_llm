import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'

import { CapabilitiesModule } from './modules/capabilities/capabilities.module'
import { HealthModule } from './modules/health/health.module'
import { DomainsModule } from './modules/domains/domains.module'
import { AutomationModule } from './modules/automation/automation.module'
import { WorkflowApiKeysModule } from './modules/workflow-api-keys/workflow-api-keys.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    HealthModule,
    CapabilitiesModule,
    DomainsModule,
    AutomationModule,
    WorkflowApiKeysModule,
  ],
})
export class AppModule {}
