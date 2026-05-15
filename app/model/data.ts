import {Pool} from "pg";
import {DEFAULT_MODEL_PROFILE_ID, MODEL_PROFILES, isModelProfileId, isModelType} from "@/app/model/profiles";
import type {ModelProfileId, ModelType} from "@/app/model/profiles";

export type ModelConfig = {
  id: ModelProfileId;
  label: string;
  model_type: ModelType;
  api_base_url: string;
  api_key: string;
  api_key_configured: boolean;
  model: string;
  updated_at: string;
};

const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? "10.0.0.209",
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER ?? "postgres",
  password: process.env.POSTGRES_PASSWORD ?? "password",
  database: process.env.POSTGRES_DATABASE ?? "postgres",
  max: 10,
});

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

const profileLabel = (id: ModelProfileId) => MODEL_PROFILES.find((profile) => profile.id === id)?.label ?? id;
const profileModelType = (id: ModelProfileId) => MODEL_PROFILES.find((profile) => profile.id === id)?.model_type ?? "llm";

const ensureModelConfigSchema = async () => {
  schemaReady ??= (async () => {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${postgresSchema}`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id text PRIMARY KEY,
        label text NOT NULL,
        model_type text NOT NULL DEFAULT 'llm',
        api_base_url text NOT NULL DEFAULT '',
        api_key text NOT NULL DEFAULT '',
        provider_model text NOT NULL DEFAULT '',
        updated_at timestamptz NOT NULL
      );
    `);
    await pool.query(`ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS model_type text NOT NULL DEFAULT 'llm'`);

    const timestamp = new Date().toISOString();
    for (const profile of MODEL_PROFILES) {
      await pool.query(
        `INSERT INTO ${tableName}
           (id, label, model_type, api_base_url, api_key, provider_model, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label`,
        [
          profile.id,
          profile.label,
          profile.model_type,
          "",
          "",
          profile.id,
          timestamp,
        ],
      );
    }
  })();

  await schemaReady;
};

export const listModelConfigs = async (): Promise<ModelConfig[]> => {
  await ensureModelConfigSchema();
  const {rows} = await pool.query(
    `SELECT id, label, model_type, api_base_url, api_key, provider_model, updated_at FROM ${tableName}`,
  );
  const rowsById = new Map(rows.map((row) => [String(row.id), row]));

  return MODEL_PROFILES.map((profile) => {
    const row = rowsById.get(profile.id);
    return {
      id: profile.id,
      label: profile.label,
      model_type: isModelType(row?.model_type) ? row.model_type : profile.model_type,
      api_base_url: String(row?.api_base_url ?? ""),
      api_key: "",
      api_key_configured: Boolean(String(row?.api_key ?? "")),
      model: String(row?.provider_model ?? profile.id),
      updated_at: toIso(row?.updated_at),
    };
  });
};

export const updateModelConfig = async (
  id: string,
  input: {
    api_base_url?: string;
    api_key?: string;
    model?: string;
    model_type?: string;
  },
) => {
  if (!isModelProfileId(id)) {
    throw new Error(`Unknown model profile "${id}".`);
  }

  await ensureModelConfigSchema();
  const timestamp = new Date().toISOString();
  await pool.query(
    `UPDATE ${tableName}
        SET api_base_url = $2,
            api_key = CASE WHEN $3::text IS NULL THEN api_key ELSE $3 END,
            provider_model = $4,
            model_type = $5,
            updated_at = $6
      WHERE id = $1`,
    [
      id,
      input.api_base_url?.trim() ?? "",
      input.api_key === undefined ? null : input.api_key,
      input.model?.trim() || id,
      isModelType(input.model_type) ? input.model_type : profileModelType(id),
      timestamp,
    ],
  );
};

export const resolveModelConfig = async (id: unknown): Promise<ModelConfig> => {
  const profileId = isModelProfileId(id) ? id : DEFAULT_MODEL_PROFILE_ID;
  await ensureModelConfigSchema();
  const {rows} = await pool.query(
    `SELECT id, label, model_type, api_base_url, api_key, provider_model, updated_at FROM ${tableName} WHERE id = $1`,
    [profileId],
  );
  const row = rows[0] as Record<string, unknown> | undefined;
  const api_base_url = String(row?.api_base_url || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const api_key = String(row?.api_key || process.env.OPENAI_API_KEY || "");
  const model = String(row?.provider_model || profileId || process.env.OPENAI_MODEL || profileId);

  return {
    id: profileId,
    label: profileLabel(profileId),
    model_type: isModelType(row?.model_type) ? row.model_type : profileModelType(profileId),
    api_base_url,
    api_key,
    api_key_configured: Boolean(api_key),
    model,
    updated_at: toIso(row?.updated_at),
  };
};
