"use client";

import {useMemo, useState} from "react";
import type {WorkflowRecord} from "@/app/workflow/data";

type PlaygroundEvent = {
  event: string;
  data: unknown;
};

const parseSseChunk = (buffer: string) => {
  const events: PlaygroundEvent[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    const eventLine = part.split("\n").find((line) => line.startsWith("event: "));
    const dataLine = part.split("\n").find((line) => line.startsWith("data: "));
    if (!eventLine || !dataLine) continue;

    events.push({
      event: eventLine.slice("event: ".length),
      data: JSON.parse(dataLine.slice("data: ".length)) as unknown,
    });
  }

  return {events, rest};
};

export default function PlaygroundClient({workflows}: {workflows: WorkflowRecord[]}) {
  const [workflowId, setWorkflowId] = useState(workflows[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [events, setEvents] = useState<PlaygroundEvent[]>([]);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);

  const workflow = useMemo(
    () => workflows.find((item) => item.id === workflowId),
    [workflowId, workflows],
  );

  const runWorkflow = async () => {
    if (!workflow) return;

    setIsRunning(true);
    setEvents([]);
    setResult(null);
    setError("");

    try {
      const formData = new FormData();
      formData.set("workflow_id", workflow.id);
      formData.set("workflow", JSON.stringify(workflow.graph));
      formData.set("query", query);

      const response = await fetch("/api/workflow/run", {
        method: "POST",
        body: formData,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Workflow run failed with HTTP ${response.status}.`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const {done, value} = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, {stream: true});
        const parsed = parseSseChunk(buffer);
        buffer = parsed.rest;

        for (const event of parsed.events) {
          setEvents((current) => [...current, event]);
          if (event.event === "workflow_completed") {
            setResult(event.data);
          }
          if (event.event === "workflow_error") {
            setError(
              event.data && typeof event.data === "object" && "error" in event.data
                ? String((event.data as {error?: unknown}).error ?? "Workflow execution failed.")
                : "Workflow execution failed.",
            );
          }
        }
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Workflow execution failed.");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-full bg-[#f5f7fb] px-6 py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">試驗場</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-950">工作流試驗場</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            選擇工作流、輸入問題，毋須打開完整編輯器都可以檢視即時執行事件。
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Workflow</span>
              <select
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                onChange={(event) => setWorkflowId(event.target.value)}
                value={workflowId}
              >
                {workflows.map((item) => (
                  <option key={item.id} value={item.id}>{item.title}</option>
                ))}
              </select>
            </label>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Query</span>
              <textarea
                className="min-h-44 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ask something..."
                value={query}
              />
            </label>

            <button
              className="mt-4 w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
              disabled={!workflow || isRunning}
              onClick={() => void runWorkflow()}
              type="button"
            >
              {isRunning ? "Running..." : "Run Workflow"}
            </button>

            {error ? (
              <p className="mt-4 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-950">Live Events</h2>
              <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
                {events.map((event, index) => (
                  <details className="rounded-xl border border-zinc-200 bg-zinc-50 p-3" key={`${event.event}-${index}`}>
                    <summary className="cursor-pointer text-sm font-semibold text-zinc-800">{event.event}</summary>
                    <pre className="mt-2 max-h-56 overflow-auto rounded-lg bg-zinc-950 p-2 text-xs leading-5 text-zinc-100">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  </details>
                ))}
                {!events.length ? (
                  <p className="rounded-xl border border-dashed border-zinc-200 px-3 py-12 text-center text-sm text-zinc-500">
                    Run a workflow to see live events.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
              <h2 className="text-base font-semibold text-zinc-950">Result</h2>
              <pre className="mt-4 max-h-[520px] overflow-auto rounded-xl bg-zinc-950 p-3 text-xs leading-5 text-zinc-100">
                {JSON.stringify(result ?? {status: "No result yet"}, null, 2)}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
