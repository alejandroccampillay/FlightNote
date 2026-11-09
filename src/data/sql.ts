// Interfaz mínima de SQLite que usan los repositorios.
// `SQLiteDatabase` de expo-sqlite la cumple tal cual; en los tests se usa `node:sqlite`.

export type SqlValue = string | number | null;

export interface SqlRunResult {
  lastInsertRowId: number;
  changes: number;
}

export interface SqlExecutor {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params: SqlValue[]): Promise<SqlRunResult>;
  getFirstAsync<T>(source: string, params: SqlValue[]): Promise<T | null>;
  getAllAsync<T>(source: string, params: SqlValue[]): Promise<T[]>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
