/**
 * Placeholder para operacoes SQLite local.
 * Sera implementado com @capacitor-community/sqlite.
 */

export interface LocalDatabase {
  execute(sql: string, params?: unknown[]): Promise<void>
  query<T>(sql: string, params?: unknown[]): Promise<T[]>
}

export function createLocalDatabase(): LocalDatabase {
  return {
    async execute(_sql: string, _params?: unknown[]) {
      // TODO: implementar com SQLite plugin
    },
    async query<T>(_sql: string, _params?: unknown[]): Promise<T[]> {
      // TODO: implementar com SQLite plugin
      return []
    },
  }
}
