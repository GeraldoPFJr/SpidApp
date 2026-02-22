import { useCallback, useEffect, useRef, useState } from 'react'
import { apiClient } from '../lib/api'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>
  mutate: (data: T | null) => void
}

interface UseApiOptions {
  immediate?: boolean
}

// Note: apiClient already injects auth headers (X-App-Instance-Id, X-Sync-Secret)
// from credentials.ts getters. Do NOT override them here.

export function useApi<T>(
  url: string | null,
  options: UseApiOptions = {},
): UseApiReturn<T> {
  const { immediate = true } = options
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate && url !== null,
    error: null,
  })
  const mountedRef = useRef(true)

  const fetchData = useCallback(async () => {
    if (!url) return
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const data = await apiClient<T>(url)
      if (mountedRef.current) {
        setState({ data, loading: false, error: null })
      }
    } catch (err) {
      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err instanceof Error ? err.message : 'Erro desconhecido',
        }))
      }
    }
  }, [url])

  useEffect(() => {
    mountedRef.current = true
    if (immediate && url) {
      fetchData()
    }
    return () => {
      mountedRef.current = false
    }
  }, [fetchData, immediate, url])

  const mutate = useCallback((data: T | null) => {
    setState((prev) => ({ ...prev, data }))
  }, [])

  return {
    ...state,
    refetch: fetchData,
    mutate,
  }
}

export function useApiMutation<TInput, TOutput = unknown>(url: string) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(
    async (body: TInput, method = 'POST'): Promise<TOutput | null> => {
      setLoading(true)
      setError(null)
      try {
        const result = await apiClient<TOutput>(url, { method, body })
        setLoading(false)
        return result
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro desconhecido'
        setError(msg)
        setLoading(false)
        return null
      }
    },
    [url],
  )

  return { execute, loading, error }
}
