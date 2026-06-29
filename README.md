# poc_reactflow_rag_llm

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## TypeORM

TypeORM is configured for PostgreSQL in `app/lib/typeorm.ts` and reuses the existing database environment variables:

```bash
POSTGRES_HOST=10.0.0.209
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DATABASE=postgres
POSTGRES_SCHEMA=public
```

You can also set `DATABASE_URL` instead of the individual `POSTGRES_*` values. Import `getDataSource` from `@/app/lib/typeorm` in server-only code.

Existing PostgreSQL tables are mapped as one-file-per-entity TypeORM classes in `app/lib/entities/`: `datasets`, `documents`, `chunks`, `tasks`, `embeddings`, `workflow_graphs`, `workflow_runs`, `mcp_servers`, and `model_configs`.

## Workspace Tools

Workspace tools live at `/tools`, following the same broad model as Dify workspace tools: define reusable tools once, then select them from workflow nodes.

The current implementation imports OpenAPI / Swagger operations into Custom HTTP Tools:

- CRUD API: `GET/POST /api/tools`, `GET/PUT/DELETE /api/tools/[toolId]`
- OpenAPI import API: `POST /api/tools/import-openapi`
- Imported definition: operation name, description, HTTP method, OpenAPI path, URL, headers, params, body, input schema, enabled flag
- Auth per imported tool: None, Basic, or Bearer
- Dynamic workflow node: add a `Tool` node, select a tool, and map node inputs into `arg.*`

Tool templates support workflow-style variables inside URL, headers, params, and body:

```text
{{#arg.query#}}
{{#input.query#}}
```

When a Tool node runs, it loads the latest tool definition from PostgreSQL, so editing a workspace tool updates future workflow executions without editing existing workflow graphs.

OpenAPI import accepts either `spec_url` or pasted JSON `spec`:

```json
{
  "spec_url": "https://example.com/openapi.json",
  "base_url": "https://api.example.com",
  "auth_type": "bearer",
  "auth_token": "secret-token"
}
```

Path parameters such as `/users/{id}` become `{{#arg.id#}}`; query/header parameters become input mappings generated from the OpenAPI parameter schema.

## RAG Backends

The Knowledge Retrieval workflow node supports hybrid RAG and optional Graph RAG:

- Elasticsearch stores chunk text and dense vectors, then combines vector KNN with BM25 keyword retrieval.
- Neo4j can store extracted chunk triples as `(:Entity)-[:RELATED_TO]->(:Entity)` relations.
- ArangoDB can store the same graph shape in `kg_entities`, `kg_edges`, and `kg_chunks`.

During dataset ingestion, chunks are embedded and indexed in Elasticsearch. If Graph RAG is enabled, the same chunk text is converted into simple subject-predicate-object triples and upserted into the configured graph database. Graph write failures are logged as warnings and do not block Elasticsearch ingestion.

Graph RAG is disabled by default. Enable either backend in `.env`:

```bash
GRAPH_RAG_NEO4J_ENABLED=true
NEO4J_URI=http://localhost:7474
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=neo4j

GRAPH_RAG_ARANGODB_ENABLED=true
ARANGODB_URL=http://localhost:8529
ARANGODB_USERNAME=root
ARANGODB_PASSWORD=password
ARANGODB_DATABASE=_system
ARANGODB_ENTITY_COLLECTION=kg_entities
ARANGODB_EDGE_COLLECTION=kg_edges
ARANGODB_CHUNK_COLLECTION=kg_chunks
```

The graph extraction layer lives in `app/lib/graph-rag.ts`, so the heuristic triple extraction can later be replaced with a stronger txt2kg or LLM extraction pipeline without changing the workflow node contract.

### RAG Modes

Knowledge Retrieval supports these modes from the node panel:

- Hybrid: combines vector, BM25, Neo4j, and ArangoDB result sets.
- Conversational: sends recent workflow run turns as retrieval context.
- Feedback: reads `rag_feedback` records and boosts or suppresses chunks.
- Agentic: decomposes a query into multiple subqueries and merges results.
- Adaptive: enables retrieval sources based on query intent, such as graph-heavy or keyword-heavy questions.

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

### Multi-Source Documents

`POST /api/datasets` accepts normal staged file uploads and a `sources` array. Sources are converted to `.txt` documents, then processed by the same chunking, embedding, Elasticsearch, and Graph RAG pipeline.

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

Website sources are fetched directly. YouTube and audio sources use optional transcript services:

```bash
YOUTUBE_TRANSCRIPT_API_URL=https://your-service/transcript/youtube
AUDIO_TRANSCRIPTION_API_URL=https://your-service/transcript/audio
NOTION_TOKEN=secret_...
```

## Deploy With PM2

This project includes `ecosystem.config.cjs` for `pm2 deploy`.

### 1. Install PM2 locally and on the server

```bash
npm install -g pm2
```

The remote server must also have Node.js, npm, git, and PM2 installed.

### 2. Edit `ecosystem.config.cjs`

Update these values:

- `deploy.production.user`: SSH user on the server
- `deploy.production.host`: server IP or domain
- `deploy.production.repo`: git SSH URL for this repository
- `deploy.production.ref`: branch to deploy, for example `origin/main`
- `deploy.production.path`: deployment directory on the server

Example:

```js
deploy: {
  production: {
    user: "deploy",
    host: "example.com",
    ref: "origin/main",
    repo: "git@github.com:your-user/poc_reactflow_rag_llm.git",
    path: "/var/www/poc_reactflow_rag_llm",
    "post-deploy": "npm install && npm run build && pm2 reload ecosystem.config.cjs --env production",
  },
}
```

### 3. Prepare environment variables on the server

PM2 deploy checks out the git repo, so local untracked files like `.env` are not uploaded automatically.

After the first setup, create the production `.env` file on the server:

```bash
ssh deploy@example.com
mkdir -p /var/www/poc_reactflow_rag_llm/shared
nano /var/www/poc_reactflow_rag_llm/shared/.env
```

Use `.env.example` as the template:

```bash
ELASTICSEARCH_HOSTNAME=localhost
ELASTICSEARCH_PORT=9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=changeme
ELASTICSEARCH_PROTOCOL=http
```

Then link it into the current release:

```bash
ln -sfn /var/www/poc_reactflow_rag_llm/shared/.env /var/www/poc_reactflow_rag_llm/current/.env
```

### 4. First-time setup

Run this from your local machine:

```bash
pm2 deploy ecosystem.config.cjs production setup
```

Then create/link the `.env` file as shown above, and deploy:

```bash
pm2 deploy ecosystem.config.cjs production
```

### 5. Deploy future updates

Commit and push your changes first:

```bash
git push origin main
pm2 deploy ecosystem.config.cjs production
```

The `post-deploy` command will install dependencies, build the Next.js app, and reload the PM2 process:

```bash
npm install && npm run build && pm2 reload ecosystem.config.cjs --env production
```

### 6. Useful PM2 commands

Run these on the server:

```bash
pm2 status
pm2 logs poc-reactflow-rag-llm
pm2 restart poc-reactflow-rag-llm
pm2 save
```

Rollback to the previous release from your local machine:

```bash
pm2 deploy ecosystem.config.cjs production revert 1
```
