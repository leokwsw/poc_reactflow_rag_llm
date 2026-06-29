CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant', 'system');
CREATE TYPE "IngestionJobStatus" AS ENUM ('queued', 'running', 'completed', 'failed');
CREATE TYPE "CustomToolAuthType" AS ENUM ('none', 'apiKey', 'bearer', 'basic');

CREATE TABLE "Collection" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Document" ADD COLUMN "collectionId" TEXT;
ALTER TABLE "Document" ADD COLUMN "sourceUri" TEXT;
ALTER TABLE "Document" ADD COLUMN "mimeType" TEXT;

ALTER TABLE "ModelProvider" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'openai-compatible';
ALTER TABLE "ModelProvider" ADD COLUMN "config" JSONB NOT NULL DEFAULT '{}';

ALTER TABLE "Workflow" ADD COLUMN "collectionId" TEXT;
ALTER TABLE "Workflow" ADD COLUMN "settings" JSONB NOT NULL DEFAULT '{}';

CREATE TABLE "ModelConfig" (
  "id" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "kind" "ModelProviderKind" NOT NULL,
  "model" TEXT NOT NULL,
  "parameters" JSONB NOT NULL DEFAULT '{}',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ModelConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Conversation" (
  "id" TEXT NOT NULL,
  "workflowId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "role" "MessageRole" NOT NULL,
  "content" TEXT NOT NULL,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WorkflowRun" ADD COLUMN "conversationId" TEXT;
ALTER TABLE "WorkflowRun" ADD COLUMN "messageId" TEXT;

CREATE TABLE "WorkflowNodeRun" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "nodeId" TEXT NOT NULL,
  "nodeType" TEXT NOT NULL,
  "label" TEXT,
  "input" JSONB NOT NULL DEFAULT '{}',
  "output" JSONB,
  "status" "WorkflowRunStatus" NOT NULL DEFAULT 'queued',
  "error" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  CONSTRAINT "WorkflowNodeRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkflowLog" (
  "id" TEXT NOT NULL,
  "runId" TEXT NOT NULL,
  "nodeId" TEXT,
  "level" TEXT NOT NULL DEFAULT 'info',
  "message" TEXT NOT NULL,
  "data" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkflowLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IngestionJob" (
  "id" TEXT NOT NULL,
  "collectionId" TEXT,
  "documentId" TEXT,
  "sourceType" TEXT NOT NULL,
  "sourceUri" TEXT,
  "status" "IngestionJobStatus" NOT NULL DEFAULT 'queued',
  "error" TEXT,
  "stats" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "finishedAt" TIMESTAMP(3),
  CONSTRAINT "IngestionJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "McpServer" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "identifier" TEXT NOT NULL,
  "serverUrl" TEXT NOT NULL,
  "headers" JSONB NOT NULL DEFAULT '{}',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "McpServer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "McpTool" (
  "id" TEXT NOT NULL,
  "serverId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "inputSchema" JSONB NOT NULL DEFAULT '{}',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "McpTool_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomTool" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "baseUrl" TEXT,
  "authType" "CustomToolAuthType" NOT NULL DEFAULT 'none',
  "authConfig" JSONB NOT NULL DEFAULT '{}',
  "openapiSpec" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomTool_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomToolOperation" (
  "id" TEXT NOT NULL,
  "toolId" TEXT NOT NULL,
  "operationId" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "summary" TEXT,
  "schema" JSONB NOT NULL DEFAULT '{}',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomToolOperation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Document_collectionId_idx" ON "Document"("collectionId");
CREATE INDEX "Workflow_collectionId_idx" ON "Workflow"("collectionId");
CREATE INDEX "ModelConfig_providerId_idx" ON "ModelConfig"("providerId");
CREATE INDEX "Conversation_workflowId_idx" ON "Conversation"("workflowId");
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");
CREATE INDEX "WorkflowRun_conversationId_idx" ON "WorkflowRun"("conversationId");
CREATE INDEX "WorkflowRun_messageId_idx" ON "WorkflowRun"("messageId");
CREATE INDEX "WorkflowNodeRun_runId_idx" ON "WorkflowNodeRun"("runId");
CREATE INDEX "WorkflowNodeRun_nodeId_idx" ON "WorkflowNodeRun"("nodeId");
CREATE INDEX "WorkflowLog_runId_idx" ON "WorkflowLog"("runId");
CREATE INDEX "WorkflowLog_nodeId_idx" ON "WorkflowLog"("nodeId");
CREATE INDEX "IngestionJob_collectionId_idx" ON "IngestionJob"("collectionId");
CREATE INDEX "IngestionJob_documentId_idx" ON "IngestionJob"("documentId");
CREATE UNIQUE INDEX "McpServer_identifier_key" ON "McpServer"("identifier");
CREATE UNIQUE INDEX "McpTool_serverId_name_key" ON "McpTool"("serverId", "name");
CREATE INDEX "McpTool_serverId_idx" ON "McpTool"("serverId");
CREATE UNIQUE INDEX "CustomToolOperation_toolId_operationId_key" ON "CustomToolOperation"("toolId", "operationId");
CREATE INDEX "CustomToolOperation_toolId_idx" ON "CustomToolOperation"("toolId");

ALTER TABLE "Document" ADD CONSTRAINT "Document_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Workflow" ADD CONSTRAINT "Workflow_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ModelConfig" ADD CONSTRAINT "ModelConfig_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ModelProvider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkflowRun" ADD CONSTRAINT "WorkflowRun_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkflowNodeRun" ADD CONSTRAINT "WorkflowNodeRun_runId_fkey" FOREIGN KEY ("runId") REFERENCES "WorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkflowLog" ADD CONSTRAINT "WorkflowLog_runId_fkey" FOREIGN KEY ("runId") REFERENCES "WorkflowRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IngestionJob" ADD CONSTRAINT "IngestionJob_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IngestionJob" ADD CONSTRAINT "IngestionJob_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "McpTool" ADD CONSTRAINT "McpTool_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "McpServer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CustomToolOperation" ADD CONSTRAINT "CustomToolOperation_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "CustomTool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
