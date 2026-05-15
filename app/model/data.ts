import {Pool} from "pg";
import {DEFAULT_MODEL_PROFILE_ID, MODEL_PROFILES, isModelProfileId} from "@/app/model/profiles";
import type {ModelProfileId} from "@/app/model/profiles";

export type ModelConfig = {
  id: ModelProfileId;
  label: string;
  api_base_url: string;
  api_key_configured: boolean;
  provider_model: string;
  updated_at: string;
};

export type ResolvedModelConfig = {
  id: ModelProfileId;
  label: string;
  apiBaseUrl: string;
  apiKey: string;
  model: string;
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

const ensureModelConfigSchema = async () => {
  schemaReady ??= (async () => {
    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${postgresSchema}`);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id text PRIMARY KEY,
        label text NOT NULL,
        api_base_url text NOT NULL DEFAULT '',
        api_key text NOT NULL DEFAULT '',
        provider_model text NOT NULL DEFAULT '',
        updated_at timestamptz NOT NULL
      );
    `);

    const timestamp = new Date().toISOString();
    for (const profile of MODEL_PROFILES) {
      await pool.query(
        `INSERT INTO ${tableName}
           (id, label, api_base_url, api_key, provider_model, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET label = EXCLUDED.label`,
        [
          profile.id,
          profile.label,
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
    `SELECT id, label, api_base_url, api_key, provider_model, updated_at FROM ${tableName}`,
  );
  const rowsById = new Map(rows.map((row) => [String(row.id), row]));

  return MODEL_PROFILES.map((profile) => {
    const row = rowsById.get(profile.id);
    return {
      id: profile.id,
      label: profile.label,
      api_base_url: String(row?.api_base_url ?? ""),
      api_key_configured: Boolean(String(row?.api_key ?? "")),
      provider_model: String(row?.provider_model ?? profile.id),
      updated_at: toIso(row?.updated_at),
    };
  });
};

export const updateModelConfig = async (
  id: string,
  input: {
    apiBaseUrl?: string;
    apiKey?: string;
    providerModel?: string;
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
            updated_at = $5
      WHERE id = $1`,
    [
      id,
      input.apiBaseUrl?.trim() ?? "",
      input.apiKey === undefined ? null : input.apiKey,
      input.providerModel?.trim() || id,
      timestamp,
    ],
  );
};

export const resolveModelConfig = async (id: unknown): Promise<ResolvedModelConfig> => {
  const profileId = isModelProfileId(id) ? id : DEFAULT_MODEL_PROFILE_ID;
  await ensureModelConfigSchema();
  const {rows} = await pool.query(
    `SELECT id, label, api_base_url, api_key, provider_model FROM ${tableName} WHERE id = $1`,
    [profileId],
  );
  const row = rows[0] as Record<string, unknown> | undefined;
  const apiBaseUrl = String(row?.api_base_url || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const apiKey = String(row?.api_key || process.env.OPENAI_API_KEY || "");
  const model = String(row?.provider_model || profileId || process.env.OPENAI_MODEL || profileId);

  return {
    id: profileId,
    label: profileLabel(profileId),
    apiBaseUrl,
    apiKey,
    model,
  };
};
