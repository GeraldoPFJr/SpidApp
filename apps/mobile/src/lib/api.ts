/**
 * API client for communicating with the Spid backend.
 * Automatically injects authentication headers and handles errors.
 */

import { getApiUrl, getAppInstanceId, getSyncSecret } from './credentials'

// ── Types ─────────────────────────────────────────────────

interface ApiOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  timeoutMs?: number
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// ── Helpers ───────────────────────────────────────────────

function resolveBaseUrl(): string {
  const url = getApiUrl()
  // Ensure URL ends with /api if not already present
  if (!url.endsWith('/api')) {
    return url.replace(/\/+$/, '') + '/api'
  }
  return url
}

// ── API Client ────────────────────────────────────────────

export async function apiClient<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers = {}, timeoutMs = 15_000 } = options
  const baseUrl = resolveBaseUrl()
  const url = `${baseUrl}${path}`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-App-Instance-Id': getAppInstanceId(),
        'X-Sync-Secret': getSyncSecret(),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error')
      throw new ApiError(response.status, errorBody)
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T
    }

    return response.json() as Promise<T>
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(0, `Request timeout after ${timeoutMs}ms: ${url}`)
    }

    if (error instanceof TypeError) {
      // Network error (offline, DNS failure, CORS, etc.)
      throw new ApiError(0, `Network error: ${error.message}`)
    }

    throw new ApiError(0, `Unexpected error: ${String(error)}`)
  } finally {
    clearTimeout(timeout)
  }
}

// ── Health Check ──────────────────────────────────────────

export interface HealthCheckResult {
  ok: boolean
  message: string
  latencyMs: number
}

export async function checkHealth(): Promise<HealthCheckResult> {
  const start = Date.now()
  try {
    await apiClient<unknown>('/health', { timeoutMs: 5_000 })
    return {
      ok: true,
      message: 'Conectado',
      latencyMs: Date.now() - start,
    }
  } catch (error) {
    const msg = error instanceof ApiError
      ? `Erro ${error.status}: ${error.message}`
      : String(error)
    return {
      ok: false,
      message: msg,
      latencyMs: Date.now() - start,
    }
  }
}
