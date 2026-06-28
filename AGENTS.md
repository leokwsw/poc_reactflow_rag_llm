# AGENTS.md

## 回答語言

- 盡可能用繁體中文回答問題。
- 技術名詞、檔名、指令、API 名稱可保留英文。

## 專案概況

這是 RAG Workflow Studio PoC monorepo。

- `api/`: NestJS + Prisma + PostgreSQL + Elasticsearch + Neo4j + TypeScript
- `web/`: Next.js App Router + ReactFlow + TypeScript
- Package manager: `pnpm`
- Local container runtime: Docker Compose
- 預設 PostgreSQL 在 `10.0.0.209:5432`，帳號 `postgres`，密碼 `password`
- 預設 Elasticsearch 在 `10.0.0.106:9200`，版本 `8.11.3`，帳號 `elastic`，密碼 `password`
- 預設 Elasticsearch index 是 `rag_workflow_chunks`；不要使用既有 `rag_chunks`，該 index 目前 mapping 是 `text`/`vector(dims:32)`，與本 API 的 `content`/`embedding(dims:1536)` 不相容。

本專案使用 Docker Compose 管理本機 infra；不要新增 Apple `container` 專用 scripts，除非使用者明確要求。

## 常用指令

```bash
pnpm install
pnpm infra:up
pnpm infra:down
pnpm db:migrate
pnpm dev
pnpm build
pnpm test
```

如果只驗證單一 workspace：

```bash
pnpm --filter api build
pnpm --filter api test
pnpm --filter web build
pnpm --filter web test
```

## Infra

`pnpm infra:up` 會透過 `docker compose up -d neo4j` 啟動：

- `rag-neo4j`

因為 PostgreSQL 與 Elasticsearch 預設使用遠端服務，所以 `pnpm infra:up` 只啟動本機 Neo4j。若要啟動全本機 fallback infra，使用 `pnpm infra:local:up`。

`pnpm infra:down` 會透過 `docker compose down` 停止並移除上述容器。

資料存在 Docker named volumes。

## 開發注意事項

- Prisma schema 位於 `api/prisma/schema.prisma`。
- Prisma migration 位於 `api/prisma/migrations/`。
- API module 結構維持在 `api/src/*`，依功能切分 module/service/controller/dto。
- Web UI 以工具型產品為主，避免 marketing landing page。
- ReactFlow Studio 位於 `web/src/components/StudioClient.tsx` 與 `web/src/app/studio/page.tsx`。
- OpenAI-compatible provider 設定透過 `.env`，沒有 API key 時後端應維持 mock/fallback 可跑。
- `.env` 預設放在 monorepo root；API 的 ConfigModule 會讀取 `api/.env` 與 root `.env`，不要假設環境檔只存在 `api/`。

## 驗證要求

修改完成後至少跑：

```bash
pnpm build
pnpm test
```

若改動只影響單一 workspace，可跑對應 `--filter` 指令，但 final response 要說明實際跑過哪些驗證。

## Git 與檔案

- 不要 revert 使用者既有變更，除非使用者明確要求。
- 不要 commit，除非使用者明確要求。
- 不要把 `node_modules/`、`api/dist/`、`web/.next/` 納入版本控制。
