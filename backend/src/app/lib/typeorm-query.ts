import type {QueryRunner} from "typeorm";
import {getDataSource} from "@/app/lib/typeorm";

type DbQueryResult<T extends Record<string, unknown> = Record<string, unknown>> = {
  rows: T[];
  rowCount: number;
};

type DbQueryable = {
  query: <T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    parameters?: unknown[],
  ) => Promise<DbQueryResult<T>>;
};

const structuredQuery = async <T extends Record<string, unknown> = Record<string, unknown>>(
  queryRunner: QueryRunner,
  sql: string,
  parameters?: unknown[],
): Promise<DbQueryResult<T>> => {
  const result = await queryRunner.query(sql, parameters, true);
  return {
    rows: (result.records ?? []) as T[],
    rowCount: result.affected ?? result.records?.length ?? 0,
  };
};

export const dbQuery = async <T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  parameters?: unknown[],
) => {
  const dataSource = await getDataSource();
  const queryRunner = dataSource.createQueryRunner();

  try {
    return await structuredQuery<T>(queryRunner, sql, parameters);
  } finally {
    await queryRunner.release();
  }
};

export const withDbTransaction = async <T>(callback: (db: DbQueryable) => Promise<T>) => {
  const dataSource = await getDataSource();
  const queryRunner = dataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const db: DbQueryable = {
      query: (sql, parameters) => structuredQuery(queryRunner, sql, parameters),
    };
    const result = await callback(db);
    await queryRunner.commitTransaction();
    return result;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};
