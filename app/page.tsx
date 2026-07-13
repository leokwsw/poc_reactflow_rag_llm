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
    <div className="home-flow relative w-full max-w-[520px] overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/72 p-5 shadow-[0_28px_90px_rgba(0,0,0,0.14)] backdrop-blur-2xl">
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
          <div key={node.name} className="grid grid-cols-[minmax(0,1fr)_clamp(36px,10vw,72px)] items-center gap-3">
            <div className={`rounded-lg border px-3 py-3 ${node.tone}`}>
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0 text-sm font-semibold">{node.name}</span>
                <span className="shrink-0 font-mono text-[11px] opacity-70">node-{index + 1}</span>
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
    <div className="home-page text-zinc-950">
      <section className="home-hero relative overflow-hidden">
        <div className="home-orb home-orb-one" aria-hidden="true" />
        <div className="home-orb home-orb-two" aria-hidden="true" />
        <div className="relative mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 py-16 lg:flex-row lg:justify-between lg:py-24">
          <div className="w-full max-w-3xl lg:max-w-2xl">
            <p className="mb-5 text-sm font-semibold tracking-[-0.01em] text-blue-600">Visual intelligence workspace</p>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-zinc-950 sm:text-6xl lg:text-7xl">
              讓知識流動。<br /><span className="home-gradient-text">讓 AI 真正工作。</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 tracking-[-0.01em] text-zinc-600 sm:text-xl">
              在一個視覺化工作空間，連接知識、模型與工具。設計可理解、可控制、可投入生產的 RAG 工作流。
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="home-primary-button rounded-full px-6 py-3 text-center text-sm font-semibold text-white sm:w-auto" href="/workflow">
                開始建立工作流 <span aria-hidden="true">→</span>
              </Link>
              <Link className="home-secondary-button rounded-full px-6 py-3 text-center text-sm font-semibold text-zinc-800 sm:w-auto" href="/datasets">
                管理知識庫
              </Link>
            </div>
            <div className="mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4">
              {["Native RAG", "Hybrid RAG", "Graph RAG", "Agentic RAG"].map((item) => (
                <div key={item} className="rounded-full border border-white/80 bg-white/60 px-3 py-2 text-center text-xs font-semibold text-zinc-700 shadow-sm backdrop-blur-xl">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="flex w-full justify-center lg:w-[520px] lg:shrink-0">
            <FlowPreview />
          </div>
        </div>
      </section>

      <section className="home-section px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="home-eyebrow">One canvas, every strategy</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-[-0.035em] text-zinc-950">為每一個問題，選擇合適的檢索方式。</h2>
            <p className="mt-4 text-sm leading-6 text-zinc-600">
              The project is designed to compare and compose different retrieval strategies in one workflow, from standard document grounding to graph traversal, agent planning, and adaptive routing.
            </p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {ragModes.map((item) => (
              <div key={item.title} className="home-card rounded-[1.35rem] border border-white/80 bg-white/70 p-6 shadow-sm backdrop-blur-xl">
                <h3 className="text-base font-semibold text-zinc-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section home-section-alt px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
            <div>
              <p className="home-eyebrow">Built for production</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-zinc-950">清晰架構，完整掌控。</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
                The project is built as a full-stack workflow lab: ingestion writes chunks and graph facts, retrieval plans combine vector, keyword, and graph context, and workflow nodes turn that context into model or tool actions.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {stack.map((item) => (
                <div key={item.name} className="home-card rounded-2xl border border-white bg-white/75 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-zinc-950">{item.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="home-section px-6 py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <p className="home-eyebrow">Connect everything</p>
            <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-[-0.035em] text-zinc-950">從資料到答案，全程可見。</h2>
            <p className="mt-4 text-sm leading-6 text-zinc-600">
              It brings together workflow authoring, model profile CRUD, document ingestion, graph construction, retrieval tuning, feedback capture, and generated HTTP tools. The goal is to move from a PoC React Flow RAG system into a production-ready project while keeping each subsystem visible and hackable for developers.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {sources.map((source) => (
                <span key={source} className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700">
                  {source}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {capabilities.map((item) => (
              <div key={item.title} className="home-card rounded-[1.35rem] border border-white/80 bg-white/75 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-zinc-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-zinc-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-cta mx-4 mb-4 rounded-[2rem] px-6 py-14 text-white sm:mx-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div>
            <h2 className="text-2xl font-semibold">Developer entry points</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-300">
              Start in Workflow to compose and run flows, use Datasets to ingest and index knowledge, configure model providers in Model, and import OpenAPI Swagger JSON/YAML tools in Tools.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              {href: "/chat", label: "Chat"},
              {href: "/workflow", label: "Workflow"},
              {href: "/datasets", label: "Datasets"},
              {href: "/tools", label: "Tools"},
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
