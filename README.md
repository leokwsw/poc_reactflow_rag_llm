# RAG Workflow

RAG Workflow is a production-oriented Next.js app for building and running visual AI workflows. It combines a React Flow workflow editor, chat-triggered workflow execution, dataset ingestion, Native/Hybrid/Graph RAG, dynamic OpenAPI tools, MCP integrations, and model profile management.

## What This Project Does

- **Chat**: create conversations, bind each conversation to one workflow, and trigger workflow runs from a chat interface.
- **Workflow Studio**: visually compose Start, LLM, Agent, Tool, HTTP, Knowledge Retrieval, If/Else, Note, and End nodes with React Flow.
- **RAG**: ingest documents and external sources, chunk and embed content, index chunks in Elasticsearch, and optionally index graph facts in Neo4j or ArangoDB.
- **Tools**: import OpenAPI / Swagger JSON or YAML into reusable workflow tools.
- **Models**: manage dynamic model profiles for OpenAI, Grok/xAI, Groq, Ollama, Xinference, DeepSeek, OpenRouter, LM Studio, and OpenAI-compatible APIs.
- **MCP**: store MCP server connections and inspect/call MCP tools.

## Tech Stack

- Next.js App Router
- React 19
- React Flow
- PostgreSQL
- TypeORM entity mappings plus local schema bootstrap helpers
- Elasticsearch
- Neo4j
- ArangoDB
- OpenAPI / Swagger JSON and YAML parsing
- MCP HTTP integrations

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm run lint
npm run build
```

## Main Routes

- `/` - project landing page
- `/chat` - conversation list and chat workflow runner
- `/chat/[conversationId]` - direct conversation view
- `/workflow` - workflow list
- `/workflow/[workflowId]` - React Flow workflow studio
- `/datasets` - dataset list
- `/datasets/new` - dataset creation and document/source ingestion
- `/tools` - OpenAPI Swagger import and tool group management
- `/model` - dynamic model profile CRUD
- `/mcp` - MCP server CRUD
- `/mcp-inspector` - MCP tool inspection and test calls
- `/playground` - developer workflow execution playground

## Data Storage

PostgreSQL is the source of truth for app metadata and runtime records.

Configured in `app/lib/typeorm.ts`:

```bash
POSTGRES_HOST=10.0.0.209
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DATABASE=postgres
POSTGRES_SCHEMA=public
```

`DATABASE_URL` can be used instead of individual `POSTGRES_*` variables.

Important tables include:

- `workflow_graphs`
- `workflow_runs`
- `conversations`
- `conversation_messages`
- `datasets`
- `documents`
- `chunks`
- `tasks`
- `embeddings`
- `mcp_servers`
- `model_configs`

The project no longer uses JSON seed files under `data/`. Uploaded files may still be stored under `data/uploads/`.

## Chat Workflow Execution

Chat conversations are stored in PostgreSQL. Each conversation is bound to one workflow.

When a user sends a chat message:

1. A user message is saved.
2. A pending assistant message is created.
3. The selected workflow is executed with the user message as `query`.
4. Recent completed conversation messages are passed as `conversation_history`.
5. Workflow events stream back through SSE.
6. The workflow run is saved in `workflow_runs`.
7. The assistant message is completed and linked to `workflow_run_id`.

Primary APIs:

- `GET /api/conversations`
- `POST /api/conversations`
- `GET /api/conversations/[conversationId]`
- `PATCH /api/conversations/[conversationId]`
- `DELETE /api/conversations/[conversationId]`
- `GET /api/conversations/[conversationId]/messages`
- `POST /api/conversations/[conversationId]/messages`

## Workflow Execution

The workflow runner lives in `app/lib/workflow-runner.ts`.

The developer playground and chat both rely on the same execution model. `/api/workflow/run` accepts a workflow payload and streams Server-Sent Events. Chat uses its own conversation message endpoint, then calls the same runner internally.

The default workflow is generated in code from `app/components/workflow/default-data.ts`; it is not loaded from a JSON file.

## Workspace Tools

Workspace tools live at `/tools`.

The Tools page only supports OpenAPI / Swagger JSON or YAML imports. It does not support manually entering method, URL, base URL, OpenAPI path, operation ID, import ID, enabled state, or schema fields.

Visible import fields:

- Name
- OpenAPI Swagger JSON/YAML
- Auth Method: None, Header, or Query
- Header Auth: Basic, Bearer, or Custom
- Query Auth: query name and value

Tool list behavior:

- Updating an OpenAPI import replaces generated tool definitions for that import group.
- Deleting is allowed at the imported group level.
- Deleting a single generated tool is intentionally disabled.
- Workflow Tool input mapping is generated from the OpenAPI operation schema and cannot be manually added or removed.

Key APIs:

- `GET /api/tools`
- `POST /api/tools/import-openapi`
- `GET /api/tools/[toolId]`
- `PUT /api/tools/[toolId]` returns 405 for manual updates
- `DELETE /api/tools/[toolId]` returns 405 for single-tool deletes

## RAG Backends

Knowledge Retrieval supports Native RAG, Hybrid RAG, Graph RAG, Conversational RAG, Feedback-based RAG, Agentic RAG, and Adaptive RAG.

Retrieval sources:

- Elasticsearch vector search
- Elasticsearch BM25 keyword search
- Neo4j graph traversal
- ArangoDB graph traversal

Graph RAG is optional and fails soft during indexing/search if a backend is unavailable.

Enable Neo4j:

```bash
GRAPH_RAG_NEO4J_ENABLED=true
NEO4J_URI=http://localhost:7474
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=neo4j
```

Enable ArangoDB:

```bash
GRAPH_RAG_ARANGODB_ENABLED=true
ARANGODB_URL=http://localhost:8529
ARANGODB_USERNAME=root
ARANGODB_PASSWORD=password
ARANGODB_DATABASE=_system
ARANGODB_ENTITY_COLLECTION=kg_entities
ARANGODB_EDGE_COLLECTION=kg_edges
ARANGODB_CHUNK_COLLECTION=kg_chunks
```

Feedback can be written through:

```bash
curl -X POST http://localhost:3000/api/rag/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "dataset_id": "dataset-id",
    "chunk_id": "chunk-id",
    "query": "original user question",
    "rating": "positive",
    "note": "useful answer"
  }'
```

## Multi-Source Documents

`POST /api/datasets` accepts staged file uploads and a `sources` array. Sources are converted to text documents and processed by the same chunking, embedding, Elasticsearch, and Graph RAG pipeline.

Supported source types:

- `website`
- `youtube`
- `audio`
- `notion`
- `text`

Example:

```json
{
  "title": "External Knowledge",
  "sources": [
    {"type": "website", "url": "https://example.com/docs"},
    {"type": "youtube", "url": "https://www.youtube.com/watch?v=..."},
    {"type": "audio", "url": "https://example.com/audio.mp3"},
    {"type": "notion", "notion_page_id": "..."},
    {"type": "text", "title": "Manual note", "text": "Plain text content"}
  ]
}
```

Optional transcript/source environment variables:

```bash
YOUTUBE_TRANSCRIPT_API_URL=https://your-service/transcript/youtube
AUDIO_TRANSCRIPTION_API_URL=https://your-service/transcript/audio
NOTION_TOKEN=secret_...
NOTION_VERSION=2022-06-28
```

## Docker Helpers

Docker compose files live under `docker/`:

- `docker/elastic-search/`
- `docker/neo4j-apoc/`
- `docker/arangodb/`

Use these for local search and graph RAG dependencies.

## Deployment With PM2

This project includes `ecosystem.config.cjs` for PM2 deploy.

Install PM2 locally and on the server:

```bash
npm install -g pm2
```

Edit `ecosystem.config.cjs`:

- `deploy.production.user`
- `deploy.production.host`
- `deploy.production.repo`
- `deploy.production.ref`
- `deploy.production.path`

First-time setup:

```bash
pm2 deploy ecosystem.config.cjs production setup
```

Create the production `.env` on the server, then deploy:

```bash
pm2 deploy ecosystem.config.cjs production
```

Useful server commands:

```bash
pm2 status
pm2 logs poc-reactflow-rag-llm
pm2 restart poc-reactflow-rag-llm
pm2 save
```
