/**
 * React hook for managing sync state and triggering synchronization.
 * Detects online/offline status and provides sync controls to UI.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { LocalDatabase } from '../lib/database'
import { getPendingOperations } from '../lib/database'
import type { SyncEngine, SyncResult, SyncStatus } from '../lib/sync'
import { createSyncEngine } from '../lib/sync'

interface UseSyncOptions {
  db: LocalDatabase | null
  autoSyncInterval?: number
  enableAutoSync?: boolean
}

interface UseSyncReturn {
  isSyncing: boolean
  isOnline: boolean
  lastSync: string | null
  pendingOps: number
  lastError: string | null
  syncNow: () => Promise<SyncResult | null>
}

export function useSync({
  db,
  autoSyncInterval = 30_000,
  enableAutoSync = true,
}: UseSyncOptions): UseSyncReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [status, setStatus] = useState<SyncStatus>({
    pendingOperations: 0,
    lastSyncAt: localStorage.getItem('LAST_SYNC_AT'),
    isSyncing: false,
    lastError: null,
  })

  const engineRef = useRef<SyncEngine | null>(null)

  // Online/offline detection
  useEffect(() => {
    function handleOnline() { setIsOnline(true) }
    function handleOffline() { setIsOnline(false) }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Initialize sync engine when db is ready
  useEffect(() => {
    if (!db || !db.isReady()) {
      engineRef.current = null
      return
    }

    const engine = createSyncEngine(db)
    engineRef.current = engine

    // Start auto-sync if enabled
    if (enableAutoSync) {
      engine.startAutoSync(autoSyncInterval)
    }

    // Refresh status immediately
    setStatus(engine.getStatus())

    return () => {
      engine.stopAutoSync()
      engineRef.current = null
    }
  }, [db, autoSyncInterval, enableAutoSync])

  // Refresh pending operations count periodically
  useEffect(() => {
    if (!db || !db.isReady()) return

    const refreshPending = async () => {
      try {
        const ops = await getPendingOperations(db)
        setStatus((prev) => ({ ...prev, pendingOperations: ops.length }))
      } catch { /* ignore */ }
    }

    refreshPending()
    const interval = setInterval(refreshPending, 10_000)
    return () => clearInterval(interval)
  }, [db])

  // Trigger sync on coming back online
  useEffect(() => {
    if (isOnline && engineRef.current) {
      engineRef.current.syncAll().then(() => {
        if (engineRef.current) {
          setStatus(engineRef.current.getStatus())
        }
      }).catch(() => {})
    }
  }, [isOnline])

  const syncNow = useCallback(async (): Promise<SyncResult | null> => {
    const engine = engineRef.current
    if (!engine) return null

    setStatus((prev) => ({ ...prev, isSyncing: true, lastError: null }))

    try {
      const result = await engine.syncAll()
      setStatus(engine.getStatus())
      return result
    } catch {
      if (engine) {
        setStatus(engine.getStatus())
      }
      return null
    }
  }, [])

  return {
    isSyncing: status.isSyncing,
    isOnline,
    lastSync: status.lastSyncAt,
    pendingOps: status.pendingOperations,
    lastError: status.lastError,
    syncNow,
  }
}
