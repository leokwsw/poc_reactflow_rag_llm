import {revalidatePath} from "next/cache";
import {listModelConfigs, updateModelConfig} from "@/app/model/data";
import {MODEL_TYPES, isModelType} from "@/app/model/profiles";

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

export default async function ModelPage() {
  const configs = await listModelConfigs();

  async function saveModelConfigAction(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    const api_base_url = String(formData.get("api_base_url") ?? "");
    const raw_api_key = String(formData.get("api_key") ?? "");
    const model = String(formData.get("model") ?? "");
    const model_type = String(formData.get("model_type") ?? "");

    await updateModelConfig(id, {
      api_base_url,
      api_key: raw_api_key.trim() ? raw_api_key : undefined,
      model,
      model_type: isModelType(model_type) ? model_type : undefined,
    });
    revalidatePath("/model");
  }

  return (
    <div className="min-h-full bg-[#f5f7fb] px-6 py-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">模型</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-950">模型設定檔</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-600">
            集中管理工作流及資料集會用到的模型 API 設定；圖表和資料集只會儲存設定檔名稱。
          </p>
        </div>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {configs.map((config) => (
            <form
              action={saveModelConfigAction}
              className="flex min-h-[310px] flex-col justify-between rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm"
              key={config.id}
            >
              <input name="id" type="hidden" value={config.id} />

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-950">{config.id}</h2>
                    <p className="mt-1 text-sm text-zinc-500">{config.label}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      config.api_key_configured
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                    }`}
                  >
                    {config.api_key_configured ? "Configured" : "Missing Key"}
                  </span>
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    API Base URL
                  </span>
                  <input
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    defaultValue={config.api_base_url}
                    name="api_base_url"
                    placeholder="https://api.openai.com/v1"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    Model Type
                  </span>
                  <select
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    defaultValue={config.model_type}
                    name="model_type"
                  >
                    {MODEL_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    Provider Model
                  </span>
                  <input
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    defaultValue={config.model}
                    name="model"
                    placeholder={config.id}
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
                    API Key
                  </span>
                  <input
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
                    name="api_key"
                    placeholder={config.api_key_configured ? "Leave blank to keep current key" : "Enter API key"}
                    type="password"
                  />
                </label>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-zinc-100 pt-4">
                <p className="text-xs text-zinc-500">Updated {formatDateTime(config.updated_at)}</p>
                <button
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
                  type="submit"
                >
                  Save
                </button>
              </div>
            </form>
          ))}
        </section>
      </div>
    </div>
  );
}
