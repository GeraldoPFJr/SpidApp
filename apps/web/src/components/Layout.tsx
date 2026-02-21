'use client'

import type { CSSProperties, ReactNode } from 'react'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: ReactNode
  title?: string
}

export function Layout({ children, title }: LayoutProps) {
  const containerStyle: CSSProperties = {
    display: 'flex',
    minHeight: '100vh',
  }

  const mainWrapperStyle: CSSProperties = {
    flex: 1,
    marginLeft: 'var(--sidebar-width)',
    transition: 'margin-left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
    padding: '0 32px',
    backgroundColor: 'var(--color-white)',
    borderBottom: '1px solid var(--color-border)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
  }

  const headerTitleStyle: CSSProperties = {
    fontSize: 'var(--font-lg)',
    fontWeight: 600,
    color: 'var(--color-neutral-800)',
  }

  const mainStyle: CSSProperties = {
    flex: 1,
    padding: '32px',
    backgroundColor: 'var(--color-bg)',
    overflow: 'auto',
  }

  return (
    <div style={containerStyle}>
      <Sidebar />
      <div style={mainWrapperStyle}>
        {title && (
          <header style={headerStyle}>
            <h1 style={headerTitleStyle}>{title}</h1>
          </header>
        )}
        <main style={mainStyle} className="page-enter">
          {children}
        </main>
      </div>
    </div>
  )
}
