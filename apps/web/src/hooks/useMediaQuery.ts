'use client'

import { useSyncExternalStore } from 'react'

function subscribe(callback: () => void) {
  window.addEventListener('resize', callback)
  return () => window.removeEventListener('resize', callback)
}

function getSnapshot() {
  return window.innerWidth
}

function getServerSnapshot() {
  return 1024 // default to desktop for SSR
}

export function useWindowWidth() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function useMediaQuery() {
  const width = useWindowWidth()
  return {
    isMobile: width <= 640,
    isTablet: width > 640 && width <= 1024,
    isDesktop: width > 1024,
    width,
  }
}
