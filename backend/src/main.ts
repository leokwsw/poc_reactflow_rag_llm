import { ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const config = app.get(ConfigService)
  const origins = config
    .get<string>('BACKEND_CORS_ORIGINS', 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)

  app.setGlobalPrefix('api/v1')
  app.enableCors({ origin: origins })
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
  )

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('RAG Workflow API')
      .setDescription('AI, RAG, workflow, dataset, MCP, conversation and automation API')
      .setVersion('1.0')
      .build(),
  )
  SwaggerModule.setup('docs', app, document)

  await app.listen(config.get<number>('BACKEND_PORT', 3001), '0.0.0.0')
}

void bootstrap()
