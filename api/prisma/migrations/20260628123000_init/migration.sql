CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'INGESTING', 'READY', 'FAILED');
CREATE TYPE "ModelProviderKind" AS ENUM ('llm', 'embedding', 'rerank');
CREATE TYPE "WorkflowRunStatus" AS ENUM ('queued', 'running', 'completed', 'failed');

CREATE TABLE "Document" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
  "content" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Chunk" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "tokenCount" INTEGER NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "embeddingModel" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Chunk_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ModelProvider" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "apiKeyRef" TEXT NOT NULL,
  "kind" "ModelProviderKind" NOT NULL,
  "model" TEXT NOT NULL,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ModelProvider_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Workflow" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "nodes" JSONB NOT NULL,
  "edges" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Workflow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowRun" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "input" JSONB NOT NULL,
  "output" JSONB,
  "status" "WorkflowRunStatus" NOT NULL DEFAULT 'queued',
  "trace" JSONB,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  CONSTRAINT "WorkflowRun_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Chunk_documentId_idx" ON "Chunk"("documentId");
CREATE INDEX "WorkflowRun_workflowId_idx" ON "WorkflowRun"("workflowId");

ALTER TABLE "Chunk" ADD CONSTRAINT "Chunk_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_workflowId_fkey"
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
