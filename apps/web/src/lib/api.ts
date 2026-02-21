const API_BASE = '/api'

interface ApiOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiClient<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {} } = options

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new ApiError(response.status, errorBody)
  }

  return response.json() as Promise<T>
}

export async function apiGet<T>(path: string): Promise<T> {
  return apiClient<T>(path)
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiClient<T>(path, { method: 'POST', body })
}

export async function apiPut<T>(path: string, body: unknown): Promise<T> {
  return apiClient<T>(path, { method: 'PUT', body })
}

export async function apiDelete<T>(path: string): Promise<T> {
  return apiClient<T>(path, { method: 'DELETE' })
}
