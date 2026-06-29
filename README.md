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
