'use client'

import { useCallback, useEffect, useState } from 'react'

type ToastVariant = 'success' | 'error' | 'warning'

const STORAGE_KEY = 'xpid_toast'

interface ToastState {
  message: string
  variant: ToastVariant
  visible: boolean
}

export function useToast() {
  const [state, setState] = useState<ToastState>({ message: '', variant: 'success', visible: false })

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw) {
        sessionStorage.removeItem(STORAGE_KEY)
        const data = JSON.parse(raw)
        setState({ message: data.message ?? '', variant: data.variant ?? 'success', visible: true })
      }
    } catch { /* ignore */ }
  }, [])

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setState({ message, variant, visible: true })
  }, [])

  const hideToast = useCallback(() => {
    setState((prev) => ({ ...prev, visible: false }))
  }, [])

  const toastProps = {
    message: state.message,
    variant: state.variant as 'success' | 'error' | 'warning',
    visible: state.visible,
    onClose: hideToast,
  }

  return { showToast, hideToast, toastProps }
}

export function setToastFlash(message: string, variant: ToastVariant = 'success') {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ message, variant })) } catch { /* ignore */ }
}
