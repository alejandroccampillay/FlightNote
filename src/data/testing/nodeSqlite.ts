/// <reference types="node" />
// Adaptador de `node:sqlite` a SqlExecutor, solo para tests con `node --test`.
import { DatabaseSync } from 'node:sqlite';

import type { SqlExecutor, SqlRunResult, SqlValue } from '../sql.ts';

export function openNodeDatabase(path = ':memory:', readOnly = false): SqlExecutor {
  const db = new DatabaseSync(path, { readOnly });
  const plain = <T>(row: unknown): T => ({ ...(row as object) }) as T;
  return {
    async execAsync(source: string) {
      db.exec(source);
    },
    async runAsync(source: string, params: SqlValue[]): Promise<SqlRunResult> {
      const r = db.prepare(source).run(...params);
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    async getFirstAsync<T>(source: string, params: SqlValue[]) {
      const row = db.prepare(source).get(...params);
      return row === undefined ? null : plain<T>(row);
    },
    async getAllAsync<T>(source: string, params: SqlValue[]) {
      return db.prepare(source).all(...params).map((r: unknown) => plain<T>(r));
    },
    async withTransactionAsync(task: () => Promise<void>) {
      db.exec('BEGIN');
      try {
        await task();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
}
