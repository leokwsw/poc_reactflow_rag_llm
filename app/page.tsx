import Link from "next/link";

const stack = [
  {name: "Next.js", detail: "App Router UI, API routes, server actions"},
  {name: "React Flow", detail: "Visual workflow canvas and node orchestration"},
  {name: "PostgreSQL", detail: "Workflow, model, dataset, and tool metadata"},
  {name: "Elasticsearch", detail: "Hybrid vector and BM25 retrieval"},
  {name: "Neo4j", detail: "Graph RAG entity and relation traversal"},
  {name: "ArangoDB", detail: "Knowledge graph collections for txt2kg-style graphs"},
];

const capabilities = [
  {
    title: "Dynamic Tools",
    text: "Imports OpenAPI Swagger JSON/YAML into generated HTTP tools, with fixed input mappings derived from the spec.",
  },
  {
    title: "Model Routing",
    text: "Stores dynamic model profiles for OpenAI, Groq, xAI/Grok, Ollama, DeepSeek, OpenRouter, LM Studio, and compatible APIs.",
  },
];

const ragModes = [
  {
    title: "Native RAG",
    text: "Indexes chunks from uploaded or connected knowledge sources, retrieves grounded context, and sends citations into workflow LLM nodes.",
  },
  {
    title: "Hybrid RAG",
    text: "Combines dense vector similarity with BM25 keyword retrieval through Elasticsearch for higher recall and better exact-match grounding.",
  },
  {
    title: "Graph RAG",
    text: "Builds entity and relationship context in Neo4j or ArangoDB so answers can follow connections across people, concepts, documents, and events.",
  },
  {
    title: "Conversational RAG",
    text: "Uses chat history and the current user intent together, so follow-up questions can retrieve context without losing the conversation thread.",
  },
  {
    title: "Feedback-based RAG",
    text: "Captures answer feedback and retrieval signals that developers can use to tune ranking, source quality, and future workflow behavior.",
  },
  {
    title: "Agentic RAG",
    text: "Lets agent nodes plan retrieval steps, call tools, inspect intermediate results, and decide when additional context is needed.",
  },
  {
    title: "Adaptive RAG",
    text: "Chooses between native, hybrid, graph, tool-assisted, or model-only paths based on the question, source availability, and workflow state.",
  },
];

const sources = ["PDF", "DOCX", "XLSX", "CSV", "Website", "YouTube", "Audio", "Notion"];

const workflowNodes = [
  {name: "Start", tone: "bg-emerald-50 text-emerald-800 border-emerald-200"},
  {name: "Knowledge Retrieval", tone: "bg-cyan-50 text-cyan-800 border-cyan-200"},
  {name: "Tool Call", tone: "bg-amber-50 text-amber-800 border-amber-200"},
  {name: "LLM / Agent", tone: "bg-zinc-950 text-white border-zinc-950"},
  {name: "End", tone: "bg-zinc-50 text-zinc-800 border-zinc-200"},
];

function FlowPreview() {
  return (
    <div className="relative rounded-lg border border-zinc-200 bg-white p-4 shadow-[0_24px_80px_rgba(24,24,27,0.10)]">
      <div className="mb-4 flex items-center justify-between border-b border-zinc-100 pb-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">React Flow Canvas</p>
          <p className="mt-1 text-sm font-semibold text-zinc-950">RAG workflow execution graph</p>
        </div>
        <div className="flex gap-1.5">
          <span className="size-2 rounded-full bg-emerald-400" />
          <span className="size-2 rounded-full bg-cyan-400" />
          <span className="size-2 rounded-full bg-zinc-300" />
        </div>
      </div>

      <div className="grid gap-3">
        {workflowNodes.map((node, index) => (
          <div key={node.name} className="grid grid-cols-[minmax(0,1fr)_72px] items-center gap-3">
            <div className={`rounded-lg border px-3 py-3 ${node.tone}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold">{node.name}</span>
                <span className="font-mono text-[11px] opacity-70">node-{index + 1}</span>
              </div>
            </div>
            <div className="h-px bg-zinc-200" />
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {["Elasticsearch", "Neo4j", "PostgreSQL"].map((item) => (
          <div key={item} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-center text-xs font-medium text-zinc-700">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="bg-white text-zinc-950">
      <section className="border-b border-zinc-200 bg-[linear-gradient(180deg,#ffffff_0%,#f7faf9_100%)]">
        <div className="mx-auto grid min-h-[calc(100vh-3.5rem)] max-w-7xl grid-cols-1 items-center gap-10 px-6 py-14 lg:grid-cols-[minmax(0,1fr)_520px] lg:py-20">
          <div>
            <h1 className="max-w-4xl text-4xl font-semibold leading-[1.05] tracking-normal text-zinc-950 sm:text-5xl lg:text-6xl">
              Build RAG workflows with visual AI orchestration.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-600 sm:text-lg">
              EZChat RAG Workflow is a Next.js production project for composing native RAG, hybrid RAG, graph RAG, tools, agents, and model calls on a React Flow canvas. It connects PostgreSQL metadata, Elasticsearch retrieval, Neo4j and ArangoDB graph context, dynamic OpenAPI tools, and multi-modal dataset ingestion into one developer-facing workspace.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="rounded-lg bg-zinc-950 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-zinc-800" href="/workflow">
                Open Workflow
              </Link>
              <Link className="rounded-lg border border-zinc-300 bg-white px-5 py-3 text-center text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50" href="/datasets">
                Manage Datasets
              </Link>
            </div>
            <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {["Native RAG", "Hybrid RAG", "Graph RAG", "Agentic RAG"].map((item) => (
                <div key={item} className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <FlowPreview />
        </div>
      </section>

      <section className="border-b border-zinc-200 px-6 py-14">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-semibold leading-tight text-zinc-950">RAG modes supported</h2>
            <p className="mt-4 text-sm leading-6 text-zinc-600">
              The project is designed to compare and compose different retrieval strategies in one workflow, from standard document grounding to graph traversal, agent planning, and adaptive routing.
            </p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {ragModes.map((item) => (
              <div key={item.title} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-zinc-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-zinc-200 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-950">Architecture At A Glance</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                The project is built as a full-stack workflow lab: ingestion writes chunks and graph facts, retrieval plans combine vector, keyword, and graph context, and workflow nodes turn that context into model or tool actions.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {stack.map((item) => (
                <div key={item.name} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <h3 className="text-sm font-semibold text-zinc-950">{item.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <h2 className="text-3xl font-semibold leading-tight text-zinc-950">What this project is doing</h2>
            <p className="mt-4 text-sm leading-6 text-zinc-600">
              It brings together workflow authoring, model profile CRUD, document ingestion, graph construction, retrieval tuning, feedback capture, and generated HTTP tools. The goal is to move from a PoC React Flow RAG system into a production-ready EZChat project while keeping each subsystem visible and hackable for developers.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {sources.map((source) => (
                <span key={source} className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700">
                  {source}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {capabilities.map((item) => (
              <div key={item.title} className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-zinc-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-zinc-950 px-6 py-12 text-white">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <h2 className="text-2xl font-semibold">Developer entry points</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
              Start in Workflow to compose and run flows, use Datasets to ingest and index knowledge, configure model providers in Model, and import OpenAPI Swagger JSON/YAML tools in Tools.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              {href: "/workflow", label: "Workflow"},
              {href: "/datasets", label: "Datasets"},
              {href: "/tools", label: "Tools"},
              {href: "/model", label: "Models"},
            ].map((item) => (
              <Link key={item.href} className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10" href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
