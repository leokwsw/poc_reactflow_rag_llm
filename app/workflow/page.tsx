import Link from "next/link";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {cloneWorkflow, createWorkflow, deleteWorkflow, listWorkflows} from "@/app/workflow/data";
import ConfirmSubmitButton from "@/app/components/confirm-submit-button";

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

  async function cloneWorkflowAction(formData: FormData) {
    "use server";
    const workflowId = String(formData.get("workflow_id") ?? "");
    const workflow = await cloneWorkflow(workflowId);
    if (workflow) {
      redirect(`/workflow/${workflow.id}`);
    }
    revalidatePath("/workflow");
  }

  async function deleteWorkflowAction(formData: FormData) {
    "use server";
    const workflowId = String(formData.get("workflow_id") ?? "");
    await deleteWorkflow(workflowId);
    revalidatePath("/workflow");
  }

  return (
    <div className="min-h-full bg-[#f5f7fb] px-6 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Workflow</p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-950">Workflows</h1>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <form
            action={createWorkflowAction}
            className="flex min-h-[230px] flex-col justify-center rounded-2xl border border-dashed border-zinc-300 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-400 hover:bg-white hover:shadow-md"
          >
            <button className="flex h-full w-full flex-col items-start justify-center gap-4 text-left" type="submit">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-900 text-2xl font-light leading-none text-white">
                +
              </span>
              <span>
                <span className="block text-lg font-semibold text-zinc-950">Create Workflow</span>
                <span className="mt-1 block text-sm text-zinc-500">Start with a blank workflow graph.</span>
              </span>
            </button>
          </form>

          {workflows.map((workflow) => (
            <article
              className="group flex min-h-[230px] flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md"
              key={workflow.id}
            >
              <Link className="min-w-0" href={`/workflow/${workflow.id}`}>
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

              <div className="mt-4 flex gap-2 border-t border-zinc-100 pt-3">
                <form action={cloneWorkflowAction} className="flex-1">
                  <input name="workflow_id" type="hidden" value={workflow.id} />
                  <button
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
                    type="submit"
                  >
                    Clone Workflow
                  </button>
                </form>
                <form action={deleteWorkflowAction} className="flex-1">
                  <input name="workflow_id" type="hidden" value={workflow.id} />
                  <ConfirmSubmitButton
                    className="w-full rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100"
                    message={`Delete workflow "${workflow.title}"? This cannot be undone.`}
                  >
                    Delete Workflow
                  </ConfirmSubmitButton>
                </form>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
