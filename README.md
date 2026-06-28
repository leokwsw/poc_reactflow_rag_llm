# RAG Workflow Studio PoC

Monorepo PoC for Native RAG, Graph RAG, Elasticsearch retrieval, Neo4j graph retrieval, OpenAI-compatible LLM/Embedding/Reranking APIs, and a ReactFlow workflow studio.

## Stack

- `api/`: NestJS, Prisma, PostgreSQL, Elasticsearch, Neo4j, TypeScript
- `web/`: Next.js App Router, ReactFlow, TypeScript
- Workspace: pnpm
- Local containers: Docker Compose
- Default external services:
  - PostgreSQL: `10.0.0.209:5432`
  - Elasticsearch: `10.0.0.106:9200` (`8.11.3`)

## Quick Start

```bash
cp .env.example .env
pnpm install
pnpm infra:up
pnpm db:migrate
pnpm dev
```

Keep `.env` in the monorepo root. The NestJS API loads both `api/.env` and the root `.env` so `pnpm dev` works from the workspace.

Open:

- Web: http://localhost:3000
- API: http://localhost:4000
- Neo4j Browser: http://localhost:7474
- Elasticsearch: http://10.0.0.106:9200

The PoC can run without a real LLM API key. Provider calls fall back to deterministic local mock responses so the Studio, ingestion flow, and RAG pipeline can be exercised locally.

## Docker Compose

This project uses Docker Compose for local Neo4j by default because PostgreSQL and Elasticsearch are external services. `pnpm infra:up` starts:

- `rag-neo4j`

The Compose file still includes local PostgreSQL and Elasticsearch `8.11.3` for fallback development. Use `pnpm infra:local:up` if you want all three local services:

```bash
pnpm infra:up
pnpm infra:local:up
pnpm infra:down
```

Default connection values are in `.env.example`:

```bash
DATABASE_URL="postgresql://postgres:password@10.0.0.209:5432/postgres?schema=public"
ELASTICSEARCH_NODE="http://10.0.0.106:9200"
ELASTICSEARCH_USERNAME="elastic"
ELASTICSEARCH_PASSWORD="password"
ELASTICSEARCH_INDEX="rag_workflow_chunks"
```
