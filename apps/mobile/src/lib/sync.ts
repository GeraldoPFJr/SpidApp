/**
 * Sync engine: manages push/pull operations between local SQLite and remote API.
 * Uses outbox pattern for offline-first reliability.
 */

import { apiClient } from './api'
import { getAppInstanceId } from './credentials'
import type { LocalDatabase } from './database'
import {
  getPendingOperations,
  getSyncCursor,
  markOperationsSynced,
  setSyncCursor,
} from './database'

// ─── Types ───────────────────────────────────────────────

export interface SyncEngine {
  pushOperations(): Promise<PushResult>
  pullChanges(): Promise<PullResult>
  syncAll(): Promise<SyncResult>
  startAutoSync(intervalMs?: number): void
  stopAutoSync(): void
  getStatus(): SyncStatus
}

export interface SyncStatus {
  pendingOperations: number
  lastSyncAt: string | null
  isSyncing: boolean
  lastError: string | null
}

export interface PushResult {
  pushed: number
  errors: number
}

export interface PullResult {
  applied: number
  cursor: string | null
}

export interface SyncResult {
  push: PushResult
  pull: PullResult
}

interface ServerPushResponse {
  accepted: string[]
  rejected: Array<{ operationId: string; reason: string }>
}

interface ServerPullResponse {
  changes: Array<{
    entityType: string
    action: string
    payload: Record<string, unknown>
  }>
  cursor: string | null
  hasMore: boolean
}

// ─── Entity table mapping ────────────────────────────────

const ENTITY_TABLE_MAP: Record<string, string> = {
  product: 'products',
  product_unit: 'product_units',
  customer: 'customers',
  supplier: 'suppliers',
  sale: 'sales',
  sale_item: 'sale_items',
  inventory_movement: 'inventory_movements',
  account: 'accounts',
  finance_entry: 'finance_entries',
  receivable: 'receivables',
  payment: 'payments',
}

// ─── Apply remote change to local DB ─────────────────────

async function applyChange(
  db: LocalDatabase,
  entityType: string,
  action: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const table = ENTITY_TABLE_MAP[entityType]
  if (!table) return

  if (action === 'DELETE') {
    if ('id' in payload) {
      await db.execute(`DELETE FROM ${table} WHERE id = ?`, [payload.id])
    }
    return
  }

  // UPSERT: build column list from payload keys
  const keys = Object.keys(payload)
  if (keys.length === 0) return

  const columns = keys.join(', ')
  const placeholders = keys.map(() => '?').join(', ')
  const values = keys.map((k) => {
    const v = payload[k]
    if (typeof v === 'object' && v !== null) return JSON.stringify(v)
    return v
  })

  // Use INSERT OR REPLACE for idempotent upsert
  await db.execute(
    `INSERT OR REPLACE INTO ${table} (${columns}) VALUES (${placeholders})`,
    values as unknown[],
  )
}

// ─── Sync Engine Factory ─────────────────────────────────

export function createSyncEngine(db: LocalDatabase): SyncEngine {
  let syncing = false
  let lastSyncAt: string | null = localStorage.getItem('LAST_SYNC_AT')
  let lastError: string | null = null
  let pendingCount = 0
  let autoSyncTimer: ReturnType<typeof setInterval> | null = null

  async function refreshPendingCount(): Promise<void> {
    const ops = await getPendingOperations(db)
    pendingCount = ops.length
  }

  async function pushOperations(): Promise<PushResult> {
    const operations = await getPendingOperations(db)
    if (operations.length === 0) {
      return { pushed: 0, errors: 0 }
    }

    try {
      const response = await apiClient<ServerPushResponse>('/sync/push', {
        method: 'POST',
        body: {
          deviceId: getAppInstanceId() || 'unknown',
          operations: operations.map((op) => ({
            operationId: op.operationId,
            entityType: op.entityType,
            action: op.action,
            payload: op.payload,
          })),
        },
      })

      // Mark accepted operations as synced
      if (response.accepted.length > 0) {
        await markOperationsSynced(db, response.accepted)
      }

      await refreshPendingCount()

      return {
        pushed: response.accepted.length,
        errors: response.rejected.length,
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Push failed'
      throw err
    }
  }

  async function pullChanges(): Promise<PullResult> {
    const cursor = await getSyncCursor(db)
    let totalApplied = 0
    let newCursor = cursor

    try {
      let hasMore = true

      while (hasMore) {
        const params = new URLSearchParams()
        if (newCursor) params.set('cursor', newCursor)
        params.set('deviceId', getAppInstanceId() || 'unknown')

        const response = await apiClient<ServerPullResponse>(
          `/sync/pull?${params.toString()}`,
        )

        // Apply each change to local database
        for (const change of response.changes) {
          await applyChange(db, change.entityType, change.action, change.payload)
          totalApplied++
        }

        // Update cursor
        if (response.cursor) {
          newCursor = response.cursor
          await setSyncCursor(db, response.cursor)
        }

        hasMore = response.hasMore
      }

      return { applied: totalApplied, cursor: newCursor }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Pull failed'
      throw err
    }
  }

  async function syncAll(): Promise<SyncResult> {
    if (syncing) {
      return {
        push: { pushed: 0, errors: 0 },
        pull: { applied: 0, cursor: null },
      }
    }

    if (!navigator.onLine) {
      lastError = 'Offline'
      return {
        push: { pushed: 0, errors: 0 },
        pull: { applied: 0, cursor: null },
      }
    }

    syncing = true
    lastError = null

    try {
      // Push first, then pull
      const pushResult = await pushOperations()
      const pullResult = await pullChanges()

      // Update last sync timestamp
      const now = new Date().toISOString()
      lastSyncAt = now
      localStorage.setItem('LAST_SYNC_AT', now)

      // Update settings if stored
      try {
        const stored = localStorage.getItem('spid_settings')
        if (stored) {
          const settings = JSON.parse(stored)
          settings.lastSyncAt = now
          localStorage.setItem('spid_settings', JSON.stringify(settings))
        }
      } catch { /* ignore */ }

      return { push: pushResult, pull: pullResult }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Sync failed'
      return {
        push: { pushed: 0, errors: 0 },
        pull: { applied: 0, cursor: null },
      }
    } finally {
      syncing = false
    }
  }

  function startAutoSync(intervalMs = 30_000): void {
    stopAutoSync()
    autoSyncTimer = setInterval(() => {
      if (navigator.onLine && !syncing) {
        syncAll().catch(() => {})
      }
    }, intervalMs)
  }

  function stopAutoSync(): void {
    if (autoSyncTimer) {
      clearInterval(autoSyncTimer)
      autoSyncTimer = null
    }
  }

  // Initialize pending count
  refreshPendingCount().catch(() => {})

  return {
    pushOperations,
    pullChanges,
    syncAll,
    startAutoSync,
    stopAutoSync,
    getStatus(): SyncStatus {
      return {
        pendingOperations: pendingCount,
        lastSyncAt,
        isSyncing: syncing,
        lastError,
      }
    },
  }
}
