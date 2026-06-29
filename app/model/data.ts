import {dbQuery} from "@/app/lib/typeorm-query";
import {
  DEFAULT_MODEL_PROFILE_ID,
  isModelProfileId,
  isModelProvider,
  isModelProviderSdk,
  isModelType,
  modelProviderFor,
} from "@/app/model/profiles";
import type {ModelProfileId, ModelProvider, ModelProviderSdk, ModelType} from "@/app/model/profiles";

export type ModelConfig = {
  id: ModelProfileId;
  label: string;
  provider: ModelProvider;
  sdk: ModelProviderSdk;
  model_type: ModelType;
  api_base_url: string;
  api_key: string;
  api_key_configured: boolean;
  model: string;
  updated_at: string;
};

let schemaReady: Promise<void> | null = null;

const quoteIdentifier = (value: string) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`${value} is not a valid PostgreSQL identifier.`);
  }
  return `"${value}"`;
};

const postgresSchema = quoteIdentifier((process.env.POSTGRES_SCHEMA ?? "public").trim() || "public");
const tableName = `${postgresSchema}.${quoteIdentifier("model_configs")}`;

const toIso = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  return new Date().toISOString();
};

const normalizeModelSlug = (id: string) => {
  const slug = id.trim();
  if (!isModelProfileId(slug)) {
    throw new Error("Model slug must start with a letter, number, or @ and contain only letters, numbers, ., _, -, /, :, or @.");
  }
  return slug;
};

const rowToModelConfig = (row: Record<string, unknown>): ModelConfig => {
  const provider = isModelProvider(row.provider) ? row.provider : "openai";
  const sdk = isModelProviderSdk(row.sdk) ? row.sdk : modelProviderFor(provider).sdk;
  return {
    id: normalizeModelSlug(String(row.id)),
    label: String(row.label ?? row.id ?? ""),
    provider,
    sdk,
    model_type: isModelType(row.model_type) ? row.model_type : "llm",
    api_base_url: String(row.api_base_url ?? ""),
    api_key: "",
    api_key_configured: Boolean(String(row.api_key ?? "")),
    model: String(row.provider_model ?? row.id ?? ""),
    updated_at: toIso(row.updated_at),
  };
};

const ensureModelConfigSchema = async () => {
  schemaReady ??= (async () => {
    await dbQuery(`CREATE SCHEMA IF NOT EXISTS ${postgresSchema}`);
    await dbQuery(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id text PRIMARY KEY,
        label text NOT NULL,
        provider text NOT NULL DEFAULT 'openai',
        sdk text NOT NULL DEFAULT 'openai',
        model_type text NOT NULL DEFAULT 'llm',
        api_base_url text NOT NULL DEFAULT '',
        api_key text NOT NULL DEFAULT '',
        provider_model text NOT NULL DEFAULT '',
        updated_at timestamptz NOT NULL
      );
    `);
    await dbQuery(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'openai'`);
    await dbQuery(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS sdk text NOT NULL DEFAULT 'openai'`);
    await dbQuery(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS model_type text NOT NULL DEFAULT 'llm'`);
  })();

  await schemaReady;
};

export const listModelConfigs = async (): Promise<ModelConfig[]> => {
  await ensureModelConfigSchema();
  const {rows} = await dbQuery(
    `SELECT id, label, provider, sdk, model_type, api_base_url, api_key, provider_model, updated_at
       FROM ${tableName}
      ORDER BY updated_at DESC, id ASC`,
  );
  return rows.map(rowToModelConfig);
};

export const upsertModelConfig = async (
  id: string,
  input: {
    label?: string;
    api_base_url?: string;
    api_key?: string;
    model?: string;
    model_type?: string;
    provider?: string;
    sdk?: string;
  },
) => {
  const slug = normalizeModelSlug(id);
  const provider = isModelProvider(input.provider) ? input.provider : "openai";
  const sdk = isModelProviderSdk(input.sdk) ? input.sdk : modelProviderFor(provider).sdk;
  const modelType = isModelType(input.model_type) ? input.model_type : "llm";
  const label = input.label?.trim() || slug;

  await ensureModelConfigSchema();
  const timestamp = new Date().toISOString();
  await dbQuery(
    `INSERT INTO ${tableName}
       (id, label, provider, sdk, model_type, api_base_url, api_key, provider_model, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7::text, ''), $8, $9)
     ON CONFLICT (id) DO UPDATE SET
       label = EXCLUDED.label,
       provider = EXCLUDED.provider,
       sdk = EXCLUDED.sdk,
       model_type = EXCLUDED.model_type,
       api_base_url = EXCLUDED.api_base_url,
       api_key = CASE WHEN $7::text IS NULL THEN ${tableName}.api_key ELSE EXCLUDED.api_key END,
       provider_model = EXCLUDED.provider_model,
       updated_at = EXCLUDED.updated_at`,
    [
      slug,
      label,
      provider,
      sdk,
      modelType,
      input.api_base_url?.trim() ?? "",
      input.api_key === undefined ? null : input.api_key,
      input.model?.trim() || slug,
      timestamp,
    ],
  );
};

export const updateModelConfig = upsertModelConfig;

export const deleteModelConfig = async (id: string) => {
  const slug = normalizeModelSlug(id);
  await ensureModelConfigSchema();
  await dbQuery(`DELETE FROM ${tableName} WHERE id = $1`, [slug]);
};

export const resolveModelConfig = async (id: unknown): Promise<ModelConfig> => {
  const profileId = isModelProfileId(id) ? id.trim() : DEFAULT_MODEL_PROFILE_ID;
  await ensureModelConfigSchema();
  const {rows} = await dbQuery(
    `SELECT id, label, provider, sdk, model_type, api_base_url, api_key, provider_model, updated_at FROM ${tableName} WHERE id = $1`,
    [profileId],
  );
  const row = rows[0] as Record<string, unknown> | undefined;
  const provider = isModelProvider(row?.provider) ? row.provider : "openai";
  const sdk = isModelProviderSdk(row?.sdk) ? row.sdk : modelProviderFor(provider).sdk;
  const providerPreset = modelProviderFor(provider);
  const api_base_url = String(
    row?.api_base_url || providerPreset.base_url || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
  ).replace(/\/$/, "");
  const api_key = String(row?.api_key || (provider === "openai" ? process.env.OPENAI_API_KEY : "") || "");
  const model = String(row?.provider_model || profileId || process.env.OPENAI_MODEL || profileId);

  return {
    id: profileId,
    label: String(row?.label ?? profileId),
    provider,
    sdk,
    model_type: isModelType(row?.model_type) ? row.model_type : "llm",
    api_base_url,
    api_key,
    api_key_configured: Boolean(api_key),
    model,
    updated_at: toIso(row?.updated_at),
  };
};
