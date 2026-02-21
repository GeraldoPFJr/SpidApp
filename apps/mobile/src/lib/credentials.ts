/**
 * Credential management for device identification and sync authentication.
 * Auto-initializes on first app open; persists in localStorage.
 */

// ── Storage Keys ──────────────────────────────────────────

const KEY_INSTANCE_ID = 'spid_app_instance_id'
const KEY_SYNC_SECRET = 'spid_sync_secret'
const KEY_API_URL = 'spid_api_url'

const DEFAULT_SYNC_SECRET = 'spid-sync-secret-2026'

// ── UUID v4 Generator ─────────────────────────────────────

function generateUUIDv4(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// ── Initialization ────────────────────────────────────────

/**
 * Ensures APP_INSTANCE_ID and SYNC_SECRET exist in localStorage.
 * Call once at app startup (idempotent).
 */
export function initializeCredentials(): void {
  if (!localStorage.getItem(KEY_INSTANCE_ID)) {
    localStorage.setItem(KEY_INSTANCE_ID, generateUUIDv4())
  }

  if (!localStorage.getItem(KEY_SYNC_SECRET)) {
    localStorage.setItem(KEY_SYNC_SECRET, DEFAULT_SYNC_SECRET)
  }
}

// ── Getters ───────────────────────────────────────────────

export function getAppInstanceId(): string {
  return localStorage.getItem(KEY_INSTANCE_ID) ?? ''
}

export function getSyncSecret(): string {
  return localStorage.getItem(KEY_SYNC_SECRET) ?? DEFAULT_SYNC_SECRET
}

export function getApiUrl(): string {
  const stored = localStorage.getItem(KEY_API_URL)
  if (stored) return stored

  const envUrl = import.meta.env.VITE_API_URL as string | undefined
  return envUrl ?? 'http://localhost:3000/api'
}

// ── Setters ───────────────────────────────────────────────

export function setSyncSecret(value: string): void {
  localStorage.setItem(KEY_SYNC_SECRET, value)
}

export function setApiUrl(value: string): void {
  localStorage.setItem(KEY_API_URL, value)
}

// ── Utilities ─────────────────────────────────────────────

export function getLastSyncAt(): string | null {
  return localStorage.getItem('LAST_SYNC_AT')
}
