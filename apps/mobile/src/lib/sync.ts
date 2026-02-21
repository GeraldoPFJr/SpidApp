/**
 * Placeholder para sync engine.
 * Gerencia fila de operacoes offline e sincronizacao com o servidor.
 */

export interface SyncEngine {
  pushPending(): Promise<void>
  pullChanges(): Promise<void>
  getStatus(): SyncStatus
}

export interface SyncStatus {
  pendingOperations: number
  lastSyncAt: Date | null
  isSyncing: boolean
}

export function createSyncEngine(): SyncEngine {
  return {
    async pushPending() {
      // TODO: implementar push de outbox_operations
    },
    async pullChanges() {
      // TODO: implementar pull de mudancas do servidor
    },
    getStatus(): SyncStatus {
      return {
        pendingOperations: 0,
        lastSyncAt: null,
        isSyncing: false,
      }
    },
  }
}
