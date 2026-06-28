# RAG Workflow Studio PoC

Monorepo PoC for Native RAG, Graph RAG, Elasticsearch retrieval, Neo4j graph retrieval, OpenAI-compatible LLM/Embedding/Reranking APIs, and a ReactFlow workflow studio.

## Stack

- `api/`: NestJS, Prisma, PostgreSQL, Elasticsearch, Neo4j, TypeScript
- `web/`: Next.js App Router, ReactFlow, TypeScript
- Workspace: pnpm
- Local containers: Apple `container`

## Quick Start

```bash
cp .env.example .env
pnpm install
pnpm infra:up
pnpm db:migrate
pnpm dev
```

Open:

- Web: http://localhost:3000
- API: http://localhost:4000
- Neo4j Browser: http://localhost:7474
- Elasticsearch: http://localhost:9200

The PoC can run without a real LLM API key. Provider calls fall back to deterministic local mock responses so the Studio, ingestion flow, and RAG pipeline can be exercised locally.

## Apple Container

This project uses Apple's `container` CLI instead of Docker Compose. The infra scripts start three named containers:

- `rag-postgres`
- `rag-elasticsearch`
- `rag-neo4j`

Persistent data is stored under `.container-data/`, which is ignored by git.

```bash
pnpm infra:up
pnpm infra:down
```
