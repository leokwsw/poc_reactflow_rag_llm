# Project Plan

## 1. Vision

Build a visual AI workflow and multimodal RAG platform using React Flow, Next.js, NestJS, PostgreSQL, and Elasticsearch.

The project should serve two purposes:

1. A flagship portfolio project that demonstrates production-oriented system design.
2. A technical prototype for the future EzChat AI Workflow platform.

The target is not to reproduce every feature in Dify. The priority is to build a smaller platform with strong architectural foundations, reliable workflow execution, extensible nodes, native RAG, multimodal ingestion, and unified tool integration.

## 2. Product Pillars

The platform is organized around four core pillars:

- **Workflow Definition** — visual workflow editing, validation, versioning, and publishing.
- **Reliable Execution** — durable workflow runs, dependency scheduling, retries, cancellation, and observability.
- **Dataset and RAG** — versioned documents, hybrid retrieval, reranking, and source traceability.
- **Tool Integration** — native tools, OpenAPI, MCP, and workflow-as-tool support.

## 3. Architecture Principles

### 3.1 Separate definition from execution

The React Flow graph is an editor model, not the runtime itself.

The intended flow is:

```text
Workflow Editor Graph
        ↓
Workflow Definition
        ↓
Validation and Compilation
        ↓
Compiled Execution Plan
        ↓
Durable Workflow Runtime
```

### 3.2 Keep domain boundaries explicit

Frontend components must not be imported by backend domain or runtime code.

Recommended structure:

```text
apps/
  web/
  api/
  worker/
packages/
  workflow-contracts/
  api-contracts/
  node-sdk/
  shared-types/
```

### 3.3 PostgreSQL is the source of truth

Use PostgreSQL for workflow definitions, versions, runs, node runs, credentials metadata, datasets, documents, and audit records.

Use Redis and BullMQ for dispatch, concurrency control, retries, delayed jobs, and worker coordination.

Use Elasticsearch for keyword, vector, and hybrid retrieval.

Use S3-compatible object storage such as MinIO, R2, or S3 for files and generated artifacts.

### 3.4 Everything external becomes a typed artifact

Documents, images, audio, video, generated files, and tool outputs should use a common artifact abstraction instead of being passed around as arbitrary strings.

Example artifact fields:

```text
id
workspaceId
kind
mimeType
storageUri
size
checksum
metadata
createdAt
```

### 3.5 Nodes are versioned plugins

Each node type should expose:

- manifest
- configuration schema
- input schema
- output schema
- validation logic
- execution logic
- version

Example identifiers:

```text
llm@1
http@1
http@2
knowledge-retrieval@1
```

## 4. Current Architectural Risks

- Backend runtime code still depends on frontend-style workflow models and paths.
- The current queue-based runner does not fully model dependency joins or durable execution.
- Workflow execution is coupled to synchronous HTTP requests.
- Workflow graphs are mutable and do not yet have immutable published versions.
- Retry, resume, cancellation, loop, iterator, merge, and human approval semantics are not defined.
- Credentials may become coupled to workflow JSON unless a separate secret model is introduced.
- Dataset ingestion and document lifecycle need stronger versioning.
- Automated test coverage is not yet sufficient for a workflow platform.
- API path and architecture documentation should be kept consistent.

## 5. Target Domain Model

### Workflow

- Workflow
- WorkflowDraft
- WorkflowVersion
- WorkflowRelease
- WorkflowRun
- NodeRun
- WorkflowEvent

### Dataset

- Dataset
- DataSource
- Document
- DocumentVersion
- Chunk
- EmbeddingRecord
- RetrievalProfile
- IngestionRun

### Tools

- ToolDefinition
- ToolProvider
- ToolConnection
- ToolCredential
- ToolOperation
- ToolExecution

### Platform

- Workspace
- User
- Membership
- Role
- Permission
- APIKey
- Secret
- AuditLog
- Artifact

## 6. Roadmap

## Phase 0 — Repository and Demo Foundation

### Goal

Make the repository easy to understand, run, review, and demonstrate.

### Deliverables

- [ ] Align README with the current backend and frontend structure.
- [ ] Document all required environment variables.
- [ ] Provide a complete Docker Compose development environment.
- [ ] Add architecture diagrams.
- [ ] Add sample workflows and sample datasets.
- [ ] Add seed scripts for local demos.
- [ ] Add lint, type-check, build, and test commands.
- [ ] Add CI for frontend and backend.
- [ ] Document the three primary demo scenarios.

### Success criteria

- A reviewer can run the platform locally using documented commands.
- The repository clearly communicates the product vision and architecture.
- CI validates every pull request.

## Phase 1 — Workflow Contracts and Versioning

### Goal

Create a stable boundary between the visual editor, persisted workflow definitions, and runtime execution.

### Deliverables

- [ ] Move shared workflow contracts into a standalone package.
- [ ] Define versioned workflow JSON schemas.
- [ ] Add graph validation.
- [ ] Validate node configuration, ports, and edge compatibility.
- [ ] Introduce draft and published workflow states.
- [ ] Make published workflow versions immutable.
- [ ] Add workflow migration support between schema versions.
- [ ] Add optimistic locking for draft editing.

### Success criteria

- Backend code no longer imports frontend component paths.
- Every workflow run references an immutable workflow version.
- Invalid graphs cannot be published.

## Phase 2 — Workflow Engine Rewrite

### Goal

Replace the current queue traversal with a reliable execution engine.

### Deliverables

- [ ] Add a workflow compiler.
- [ ] Generate a compiled execution plan from a validated workflow definition.
- [ ] Implement dependency-aware scheduling.
- [ ] Define branch and join semantics.
- [ ] Persist workflow runs and node runs.
- [ ] Add BullMQ and Redis.
- [ ] Move execution into dedicated workers.
- [ ] Add retries with backoff.
- [ ] Add timeout handling.
- [ ] Add cancellation.
- [ ] Add idempotency keys.
- [ ] Add resumable runs.
- [ ] Add execution concurrency limits.
- [ ] Preserve SSE or WebSocket event streaming for the UI.

### Success criteria

- Parallel branches and joins execute correctly.
- A failed node can retry without duplicating completed side effects.
- A workflow run survives API server restarts.
- Long-running executions do not depend on an open HTTP request.

## Phase 3 — Node SDK and Plugin Model

### Goal

Make node development consistent, typed, testable, and extensible.

### Deliverables

- [ ] Create a `node-sdk` package.
- [ ] Define node manifests.
- [ ] Define typed input and output ports.
- [ ] Define configuration JSON Schema.
- [ ] Add node versioning.
- [ ] Add node capability declarations.
- [ ] Add node-level validation hooks.
- [ ] Add node-level test utilities.
- [ ] Add execution sandbox boundaries where appropriate.
- [ ] Add a node registry API.

### Initial node categories

#### Flow

- [ ] Start
- [ ] End
- [ ] If / Else
- [ ] Switch
- [ ] Merge
- [ ] Parallel
- [ ] Loop
- [ ] Iterator / Map
- [ ] Retry
- [ ] Delay
- [ ] Human Approval
- [ ] Subworkflow

#### AI

- [ ] LLM
- [ ] Agent
- [ ] Structured Output
- [ ] Embedding
- [ ] Reranker
- [ ] Vision
- [ ] Speech-to-Text
- [ ] Text-to-Speech

#### Data

- [ ] JSON Transform
- [ ] Template
- [ ] Code
- [ ] Filter
- [ ] Aggregate
- [ ] File Parser

#### Integration

- [ ] HTTP
- [ ] OpenAPI Operation
- [ ] MCP Tool
- [ ] Database Query
- [ ] Webhook

### Success criteria

- A new node can be added without modifying the workflow engine core.
- Node configuration UI can be generated from schemas.
- Multiple versions of a node can coexist.

## Phase 4 — Dataset and Native RAG Redesign

### Goal

Provide transparent, configurable, and production-oriented RAG.

### Deliverables

- [ ] Separate datasets, sources, documents, document versions, and chunks.
- [ ] Make document updates versioned instead of destructive overwrites.
- [ ] Add ingestion runs and statuses.
- [ ] Add configurable chunking strategies.
- [ ] Add embedding model profiles.
- [ ] Add hybrid keyword and vector retrieval.
- [ ] Add metadata filters.
- [ ] Add reranking.
- [ ] Add retrieval profiles.
- [ ] Add chunk-level source citations.
- [ ] Add ingestion deduplication using checksums.
- [ ] Add reindex and re-embedding workflows.
- [ ] Add retrieval evaluation datasets.

### Success criteria

- A response can be traced to exact document versions and chunks.
- Retrieval settings can be changed without rewriting workflow nodes.
- Re-ingestion is reproducible and auditable.

## Phase 5 — Multimodal Ingestion and Artifacts

### Goal

Support image, audio, video, website, and document workflows through a common artifact model.

### Deliverables

- [ ] Add S3-compatible object storage.
- [ ] Add artifact metadata and lifecycle management.
- [ ] Add file upload and signed download URLs.
- [ ] Add image metadata extraction and OCR pipeline.
- [ ] Add audio transcription and segmentation pipeline.
- [ ] Add video audio extraction, transcription, keyframe extraction, and scene segmentation.
- [ ] Add website crawling, sanitization, and content extraction.
- [ ] Add generated artifact outputs from workflow nodes.
- [ ] Add artifact retention and deletion policies.

### Success criteria

- Nodes exchange typed artifacts instead of raw local file paths.
- Large media does not pass directly through API request bodies.
- Ingestion pipelines can run asynchronously and resume after failure.

## Phase 6 — Unified Tool Platform

### Goal

Expose native tools, OpenAPI operations, MCP tools, and workflows through one abstraction.

### Deliverables

- [ ] Create a unified tool registry.
- [ ] Add native tool providers.
- [ ] Add OpenAPI import and operation selection.
- [ ] Separate OpenAPI connections, credentials, operations, and node instances.
- [ ] Add MCP server connections and capability discovery.
- [ ] Add workflow-as-tool publishing.
- [ ] Add tool input and output schemas.
- [ ] Add tool execution logs.
- [ ] Add per-tool permissions and rate limits.
- [ ] Add tool health checks.

### OpenAPI and HTTP security requirements

- [ ] Block localhost and private network targets by default.
- [ ] Block cloud metadata endpoints.
- [ ] Validate redirects.
- [ ] Enforce request and response size limits.
- [ ] Enforce connection and execution timeouts.
- [ ] Redact secrets from logs.
- [ ] Support allowlists for approved hosts.

### Success criteria

- Agents can call native, OpenAPI, MCP, and workflow tools through one interface.
- Credentials never appear in exported workflow definitions.
- Tool calls are auditable and permission controlled.

## Phase 7 — EzChat Production Foundation

### Goal

Add the multi-tenant, security, and operational features needed for production use.

### Deliverables

- [ ] Workspace model.
- [ ] Authentication.
- [ ] Membership and RBAC.
- [ ] Secret management.
- [ ] API keys and scoped permissions.
- [ ] Audit logs.
- [ ] Usage metering.
- [ ] Model token and cost tracking.
- [ ] Workspace quotas.
- [ ] Rate limiting.
- [ ] Data retention policies.
- [ ] Backup and restore procedures.
- [ ] Environment promotion strategy.
- [ ] Deployment and rollback procedures.

### Success criteria

- Tenant data is isolated.
- Every sensitive action is attributable and auditable.
- Cost and usage can be measured per workspace, workflow, run, and model.

## 7. Model Abstraction

Model profiles should describe capabilities rather than exposing provider-specific assumptions throughout the system.

Recommended capabilities:

- chat
- streaming
- embeddings
- vision
- audio input
- speech-to-text
- text-to-speech
- tool calling
- structured output
- reranking
- context window
- token pricing

The runtime should select or validate models based on required capabilities.

## 8. Observability

The execution model should expose a complete trace:

```text
Workflow Run
  ├─ Node Run
  │   ├─ Model Call
  │   ├─ Tool Call
  │   ├─ Retrieval Event
  │   └─ Artifact
  └─ Workflow Events
```

### Required UI views

- [ ] Run timeline.
- [ ] Node status and duration.
- [ ] Input and output inspection with secret redaction.
- [ ] Token usage and cost.
- [ ] Tool request and response details.
- [ ] Retrieved chunks and relevance scores.
- [ ] Retry history.
- [ ] Error classification.
- [ ] Artifact previews.

### Operational metrics

- workflow success rate
- node failure rate
- queue latency
- execution latency
- model latency
- retrieval latency
- token usage
- cost per run
- worker utilization
- ingestion throughput

## 9. Testing Strategy

### Unit tests

- workflow graph validation
- compiler behavior
- node executors
- expression and template evaluation
- branch and join logic
- retry policy
- retrieval scoring

### Integration tests

- PostgreSQL repositories
- Elasticsearch indexing and retrieval
- Redis and BullMQ workers
- object storage
- OpenAPI imports
- MCP connections

### End-to-end tests

- create, validate, publish, and run a workflow
- stream workflow events
- retry a failed node
- cancel a workflow
- ingest a document and retrieve cited chunks
- execute an OpenAPI tool
- execute an MCP tool
- process a multimodal artifact

### Reliability tests

- API restart during execution
- worker restart during execution
- duplicate job delivery
- provider timeout
- partial branch failure
- Elasticsearch outage
- Redis outage

## 10. Security Checklist

- [ ] Credentials are stored separately from workflow definitions.
- [ ] Secrets are encrypted at rest.
- [ ] Secrets are redacted from logs and traces.
- [ ] Tool calls are protected against SSRF.
- [ ] Uploaded files are validated and scanned.
- [ ] Code execution is sandboxed or disabled by default.
- [ ] Workspace authorization is enforced in every repository query.
- [ ] API keys are hashed and scoped.
- [ ] Audit events are immutable.
- [ ] Destructive actions require explicit authorization.
- [ ] Rate limits and quotas are enforced.

## 11. Interview Demo Plan

### Demo 1 — Native Hybrid RAG

Show:

1. Create a dataset.
2. Upload and ingest a document.
3. Inspect document chunks.
4. Build a workflow with retrieval, reranking, and LLM nodes.
5. Run the workflow.
6. Inspect citations, retrieval scores, latency, and cost.

Key message:

> The platform implements transparent native RAG rather than hiding retrieval behind a single black-box node.

### Demo 2 — Agent with MCP and OpenAPI

Show:

1. Import an OpenAPI specification.
2. Connect an MCP server.
3. Expose both through the unified tool registry.
4. Let an agent select and invoke the appropriate tool.
5. Inspect tool execution traces and redacted credentials.

Key message:

> Native, OpenAPI, MCP, and workflow tools share a consistent execution and governance model.

### Demo 3 — Multimodal Workflow

Show:

1. Upload an audio, image, or video artifact.
2. Run asynchronous preprocessing.
3. Store derived transcripts, keyframes, or OCR results.
4. Retrieve multimodal-derived knowledge.
5. Generate a cited response or output artifact.

Key message:

> Multimodal support is designed around typed artifacts and reusable ingestion pipelines, not provider-specific UI options.

## 12. Recommended Implementation Priority

Do not prioritize adding many new nodes before stabilizing the platform foundation.

Recommended order:

1. Workflow contracts and versioning.
2. Graph validation and compilation.
3. Durable workflow execution.
4. Node SDK and plugin model.
5. Dataset and RAG redesign.
6. Artifact storage and multimodal ingestion.
7. Unified OpenAPI, MCP, and workflow tool platform.
8. Multi-tenant production controls.

## 13. Out of Scope for the Near Term

The following are valuable but should not delay the core architecture:

- Public plugin marketplace.
- Fully untrusted third-party code execution.
- A custom distributed workflow engine comparable to Temporal.
- Complex multi-agent orchestration.
- Full Graph RAG platform.
- Enterprise billing system.
- Large-scale Kubernetes deployment.

## 14. Definition of a Strong Portfolio Release

A portfolio-ready release should include:

- a clear product story
- a reproducible local environment
- architecture diagrams
- immutable workflow versions
- durable asynchronous execution
- typed and versioned nodes
- native hybrid RAG
- one OpenAPI integration
- one MCP integration
- one multimodal ingestion flow
- execution traces and cost visibility
- meaningful automated tests
- three polished demo workflows

The project should be described as:

> A visual AI workflow and multimodal RAG platform with durable execution, extensible typed nodes, native hybrid retrieval, and unified OpenAPI and MCP tool integration.
