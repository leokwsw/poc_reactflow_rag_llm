import Link from "next/link";
import {redirect} from "next/navigation";
import {createWorkflow, listWorkflows} from "@/app/workflow/data";

export const dynamic = "force-dynamic";

const formatDateTime = (value?: string | null) =>
  value
    ? new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value))
    : "Never";

export default async function WorkflowListPage() {
  const workflows = await listWorkflows();

  async function createWorkflowAction() {
    "use server";
    const workflow = await createWorkflow("Untitled Workflow");
    redirect(`/workflow/${workflow.id}`);
  }

  return (
    <div className="min-h-full bg-[#f5f7fb] px-6 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Workflow</p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-950">Workflows</h1>
          </div>
          <form action={createWorkflowAction}>
            <button
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
              type="submit"
            >
              New Workflow
            </button>
          </form>
        </div>

        {workflows.length > 0 ? (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {workflows.map((workflow) => (
              <Link
                className="group flex min-h-[190px] flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
                href={`/workflow/${workflow.id}`}
                key={workflow.id}
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 truncate text-base font-semibold text-zinc-950 group-hover:text-zinc-700">
                      {workflow.title}
                    </h2>
                    <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                      {workflow.graph.nodes.length} nodes
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-500">Updated {formatDateTime(workflow.updated_at)}</p>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 border-t border-zinc-100 pt-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Last Run</p>
                    <p className="mt-1 text-sm font-medium text-zinc-800">{formatDateTime(workflow.last_run_at)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Runs</p>
                    <p className="mt-1 text-sm font-medium text-zinc-800">{workflow.run_count ?? 0}</p>
                  </div>
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center shadow-sm">
            <h2 className="text-base font-semibold text-zinc-950">No workflows yet</h2>
            <p className="mt-2 text-sm text-zinc-500">Create a workflow to start building a graph.</p>
          </section>
        )}
      </div>
    </div>
  );
}
