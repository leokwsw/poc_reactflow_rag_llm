盡可能用繁體中文回答問題。

--- project-doc ---

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Context

This project is RAG Workflow: a production-oriented Next.js App Router app for visual AI workflows, chat-triggered workflow execution, RAG ingestion/retrieval, OpenAPI tools, MCP integrations, and model profile management.

Important surfaces:

- `/chat` and `/chat/[conversationId]`: conversation list and chat interface that trigger workflows.
- `/workflow` and `/workflow/[workflowId]`: React Flow workflow list and studio.
- `/datasets` and `/datasets/new`: dataset creation, source ingestion, chunking, embeddings, Elasticsearch, and optional Graph RAG.
- `/tools`: OpenAPI / Swagger JSON or YAML import. Manual tool creation/update is intentionally disabled.
- `/model`: dynamic model profile CRUD.
- `/mcp` and `/mcp-inspector`: MCP server storage and tool inspection.
- `/playground`: developer workflow execution playground.

## Data Rules

- PostgreSQL is the source of truth for metadata and runtime records.
- Do not reintroduce `data/*.json` seed files. The project no longer loads workflow, dataset, chunk, task, embedding, trace, or model defaults from JSON files under `data/`.
- `data/uploads/` may still contain uploaded document files and should not be treated as JSON seed data.
- Default workflow graph data is generated in code from `app/components/workflow/default-data.ts`.
- Schema bootstrap helpers follow the existing pattern in feature-local `data.ts` files and `app/lib/typeorm-query.ts`.

## Implementation Rules

- Before editing Next.js App Router pages, route handlers, server actions, or caching behavior, read the relevant docs in `node_modules/next/dist/docs/`.
- Keep Server Components as the default. Use `"use client"` only for interactive UI.
- Prefer the existing repo patterns:
  - route handlers in `app/api/**/route.ts`;
  - feature data helpers such as `app/chat/data.ts`, `app/workflow/data.ts`, `app/datasets/data.ts`;
  - TypeORM entity mappings in `app/lib/entities/`;
  - workflow node code under `app/components/workflow/nodes/`.
- Do not add a separate migration framework unless explicitly requested.
- Do not manually create or delete individual generated OpenAPI tools; generated tools belong to their OpenAPI import group.
- Workflow Tool input mappings must come from the OpenAPI spec and should not support manual add/remove.
- Graph RAG backends are optional. Neo4j and ArangoDB failures should fail soft where the current code expects warnings.

## Verification

For code changes, run:

```bash
npm run lint
npm run build
```

For frontend changes, visually smoke test the affected route. Use the browser/computer-use tools when requested.
