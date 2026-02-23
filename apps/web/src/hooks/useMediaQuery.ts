'use client'

import { useSyncExternalStore } from 'react'

function getWidth() {
  return window.innerWidth
}

function getServerWidth() {
  return 1024
}

function subscribe(callback: () => void) {
  window.addEventListener('resize', callback)
  return () => window.removeEventListener('resize', callback)
}

export function useWindowWidth() {
  return useSyncExternalStore(subscribe, getWidth, getServerWidth)
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
