import {redirect} from "next/navigation";
import {createWorkflowFromTemplate} from "@/app/workflow/data";
import {getWorkflowTemplate, workflowTemplates} from "@/app/templates/data";

export const dynamic = "force-dynamic";

export default function TemplatesPage() {
  async function createFromTemplateAction(formData: FormData) {
    "use server";
    const template = getWorkflowTemplate(String(formData.get("template_id") ?? ""));
    if (!template) return;

    const workflow = await createWorkflowFromTemplate({
      title: template.title,
      description: template.description,
      graph: template.graph,
    });
    redirect(`/workflow/${workflow.id}`);
  }

  return (
    <div className="min-h-full bg-[#f5f7fb] px-6 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Templates</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-950">Workflow Templates</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            Start from reusable workflow patterns, then customize the graph in the workflow editor.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workflowTemplates.map((template) => (
            <form
              action={createFromTemplateAction}
              className="flex min-h-[260px] flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm"
              key={template.id}
            >
              <input name="template_id" type="hidden" value={template.id} />
              <div>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                  {template.category}
                </span>
                <h2 className="mt-4 text-lg font-semibold text-zinc-950">{template.title}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">{template.description}</p>
              </div>
              <button
                className="mt-6 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
                type="submit"
              >
                Use Template
              </button>
            </form>
          ))}
        </section>
      </div>
    </div>
  );
}
