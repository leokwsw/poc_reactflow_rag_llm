# Backend / frontend separation

## Decision

The project uses two independently deployable application services:

- `frontend`: the existing Next.js App Router application, responsible for UI and rendering.
- `backend`: a NestJS REST API under `/api/v1`, responsible for business logic, persistence and integrations.

PostgreSQL remains the metadata source of truth. Elasticsearch is the default RAG index. Neo4j and ArangoDB remain optional Docker Compose profiles and must fail soft at application level.

## Supported bounded contexts

Only these product domains belong in the backend:

- AI model profiles
- RAG ingestion, retrieval and feedback
- workflows and workflow runs
- datasets, documents, chunks and embeddings
- MCP servers and MCP tool inspection
- workflow conversations and conversation messages
- automations
- workflow-scoped API keys

Authentication, login, users, accounts, organizations and RBAC are explicitly out of scope. Workflow API keys authenticate only calls to published workflow endpoints; they do not introduce user identity or tenant authorization.

## Separation rule

The migration is complete. The frontend contains no `app/api/**` route handlers, database entities, TypeORM connection, workflow executor, ingestion worker, or RAG integration. All frontend reads and mutations use the versioned backend HTTP API.

New business features must be implemented in `backend/src/modules/<context>`. Next.js may contain Server Actions for UI form handling, but those actions must call the backend API and must not access PostgreSQL, Elasticsearch, Graph RAG, uploaded files, model secrets, MCP servers, or workflow execution directly.

## Local runtime

```bash
npm install --prefix backend
npm run dev:backend
npm run dev:frontend
```

The frontend defaults to port 3000 and the backend to port 3001. Swagger UI is available at `http://localhost:3001/docs`.

Run the core Docker stack with:

```bash
docker compose up --build
```

Enable one optional Graph RAG backend with:

```bash
docker compose --profile graph-neo4j up --build
docker compose --profile graph-arangodb up --build
```
