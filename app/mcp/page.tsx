import {revalidatePath} from "next/cache";
import ConfirmSubmitButton from "@/app/components/confirm-submit-button";
import {createMcpServer, deleteMcpServer, listMcpServers, updateMcpServer} from "@/app/mcp/data";

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

export default async function McpPage() {
  const servers = await listMcpServers();

  async function createMcpServerAction(formData: FormData) {
    "use server";
    await createMcpServer({
      name: String(formData.get("name") ?? ""),
      server_identifier: String(formData.get("server_identifier") ?? ""),
      server_url: String(formData.get("server_url") ?? ""),
    });
    revalidatePath("/mcp");
  }

  async function updateMcpServerAction(formData: FormData) {
    "use server";
    await updateMcpServer(String(formData.get("id") ?? ""), {
      name: String(formData.get("name") ?? ""),
      server_identifier: String(formData.get("server_identifier") ?? ""),
      server_url: String(formData.get("server_url") ?? ""),
    });
    revalidatePath("/mcp");
  }

  async function deleteMcpServerAction(formData: FormData) {
    "use server";
    await deleteMcpServer(String(formData.get("id") ?? ""));
    revalidatePath("/mcp");
  }

  return (
    <div className="min-h-full bg-[#f5f7fb] px-6 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">MCP</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-950">MCP Servers</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            Store MCP server URLs, names, and server identifiers for workflow integrations.
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <form
            action={createMcpServerAction}
            className="flex min-h-[330px] flex-col justify-between rounded-2xl border border-dashed border-zinc-300 bg-white/80 p-4 shadow-sm"
          >
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-950">Add MCP Server</h2>
                <p className="mt-1 text-sm text-zinc-500">Create a reusable MCP server connection.</p>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Name</span>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  name="name"
                  placeholder="Company Tools"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Server Identifier</span>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  name="server_identifier"
                  placeholder="company-tools"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Server URL</span>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                  name="server_url"
                  placeholder="https://example.com/mcp"
                  type="url"
                />
              </label>
            </div>

            <button
              className="mt-6 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
              type="submit"
            >
              Add Server
            </button>
          </form>

          {servers.map((server) => (
            <article
              className="flex min-h-[330px] flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm"
              key={server.id}
            >
              <form action={updateMcpServerAction} className="space-y-4" id={`update-${server.id}`}>
                <input name="id" type="hidden" value={server.id} />

                <div>
                  <h2 className="truncate text-base font-semibold text-zinc-950">{server.name}</h2>
                  <p className="mt-1 truncate text-sm text-zinc-500">{server.server_identifier}</p>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Name</span>
                  <input
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    defaultValue={server.name}
                    name="name"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Server Identifier</span>
                  <input
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    defaultValue={server.server_identifier}
                    name="server_identifier"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Server URL</span>
                  <input
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    defaultValue={server.server_url}
                    name="server_url"
                    type="url"
                  />
                </label>
              </form>

              <div className="mt-6 flex items-center justify-between gap-2 border-t border-zinc-100 pt-4">
                <p className="text-xs text-zinc-500">Updated {formatDateTime(server.updated_at)}</p>
                <div className="flex gap-2">
                  <button
                    className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
                    form={`update-${server.id}`}
                    type="submit"
                  >
                    Save
                  </button>
                  <form action={deleteMcpServerAction}>
                    <input name="id" type="hidden" value={server.id} />
                    <ConfirmSubmitButton
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                      message={`Delete MCP server "${server.name}"?`}
                    >
                      Delete
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
