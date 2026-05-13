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

        <section className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
          <div className="grid min-w-[840px] grid-cols-[minmax(340px,1fr)_120px_170px_130px] border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            <span>Name</span>
            <span>Nodes</span>
            <span>Last Run</span>
            <span>Runs</span>
          </div>
          <div className="divide-y divide-zinc-100">
            {workflows.map((workflow) => (
              <Link
                className="grid grid-cols-[minmax(340px,1fr)_120px_170px_130px] items-center gap-4 px-4 py-4 transition hover:bg-zinc-50"
                href={`/workflow/${workflow.id}`}
                key={workflow.id}
              >
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-zinc-950">{workflow.title}</h2>
                  <p className="mt-1 text-xs text-zinc-500">Updated {formatDateTime(workflow.updated_at)}</p>
                </div>
                <div className="text-sm text-zinc-700">{workflow.graph.nodes.length}</div>
                <div className="text-sm text-zinc-600">{formatDateTime(workflow.last_run_at)}</div>
                <div className="text-sm text-zinc-700">{workflow.run_count ?? 0}</div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
