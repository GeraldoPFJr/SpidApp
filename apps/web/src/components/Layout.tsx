'use client'

import type { CSSProperties, ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  const containerStyle: CSSProperties = {
    display: 'flex',
    minHeight: '100vh',
  }

  const mainStyle: CSSProperties = {
    flex: 1,
    padding: '32px',
    backgroundColor: '#F9FAFB',
    overflow: 'auto',
  }

  return (
    <div style={containerStyle}>
      <Sidebar />
      <main style={mainStyle}>{children}</main>
    </div>
  )
}
