import "server-only";
import "reflect-metadata";

import {DataSource} from "typeorm";
import type {DataSourceOptions} from "typeorm";
import {typeormEntities} from "@/app/lib/entities";

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const optionalBoolean = (value: string | undefined) => {
  if (value === undefined) return undefined;
  return value.toLowerCase() === "true";
};

const validateIdentifier = (value: string) => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    throw new Error(`${value} is not a valid PostgreSQL identifier.`);
  }

  return value;
};

const postgresSchema = validateIdentifier((process.env.POSTGRES_SCHEMA ?? "public").trim() || "public");

const baseOptions = {
  type: "postgres",
  entities: typeormEntities,
  schema: postgresSchema,
  synchronize: process.env.TYPEORM_SYNCHRONIZE === "true",
  migrationsRun: process.env.TYPEORM_MIGRATIONS_RUN === "true",
  logging: optionalBoolean(process.env.TYPEORM_LOGGING) ?? process.env.NODE_ENV === "development",
  ssl: process.env.POSTGRES_SSL === "true" ? {rejectUnauthorized: false} : undefined,
} satisfies Partial<DataSourceOptions>;

const dataSourceOptions: DataSourceOptions = process.env.DATABASE_URL
  ? {
      ...baseOptions,
      url: process.env.DATABASE_URL,
    }
  : {
      ...baseOptions,
      host: process.env.POSTGRES_HOST ?? "10.0.0.209",
      port: toNumber(process.env.POSTGRES_PORT, 5432),
      username: process.env.POSTGRES_USER ?? "postgres",
      password: process.env.POSTGRES_PASSWORD ?? "password",
      database: process.env.POSTGRES_DATABASE ?? "postgres",
    };

const globalForTypeOrm = globalThis as typeof globalThis & {
  typeormDataSource?: DataSource;
  typeormDataSourcePromise?: Promise<DataSource>;
};

export const AppDataSource = globalForTypeOrm.typeormDataSource ?? new DataSource(dataSourceOptions);

if (process.env.NODE_ENV !== "production") {
  globalForTypeOrm.typeormDataSource = AppDataSource;
}

export const getDataSource = async () => {
  if (AppDataSource.isInitialized) {
    return AppDataSource;
  }

  globalForTypeOrm.typeormDataSourcePromise ??= AppDataSource.initialize();
  return globalForTypeOrm.typeormDataSourcePromise;
};
