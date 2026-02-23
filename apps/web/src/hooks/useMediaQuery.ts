'use client'

import { useState, useEffect } from 'react'

export function useWindowWidth() {
  const [width, setWidth] = useState(1024)

  useEffect(() => {
    setWidth(window.innerWidth)

    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return width
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
