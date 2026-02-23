'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useState, useCallback } from 'react'
import { Sidebar } from './Sidebar'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface LayoutProps {
  children: ReactNode
  title?: string
}

export function Layout({ children, title }: LayoutProps) {
  const { isMobile } = useMediaQuery()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const openDrawer = useCallback(() => setDrawerOpen(true), [])
  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  const containerStyle: CSSProperties = {
    display: 'flex',
    minHeight: '100vh',
  }

  const mainWrapperStyle: CSSProperties = {
    flex: 1,
    marginLeft: isMobile ? 0 : 'var(--sidebar-width)',
    transition: isMobile ? 'none' : 'margin-left 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: isMobile ? '100%' : undefined,
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 'var(--header-height)',
    padding: isMobile ? '0 16px' : '0 32px',
    backgroundColor: 'var(--color-white)',
    borderBottom: '1px solid var(--color-border)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    gap: '12px',
  }

  const headerTitleStyle: CSSProperties = {
    fontSize: isMobile ? 'var(--font-base)' : 'var(--font-lg)',
    fontWeight: 600,
    color: 'var(--color-neutral-800)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
  }

  const mainStyle: CSSProperties = {
    flex: 1,
    padding: isMobile ? '16px' : '32px',
    backgroundColor: 'var(--color-bg)',
    overflow: 'auto',
  }

  return (
    <div style={containerStyle}>
      <Sidebar
        isMobile={isMobile}
        mobileOpen={drawerOpen}
        onMobileClose={closeDrawer}
      />
      <div style={mainWrapperStyle} data-main-wrapper>
        <header
          style={headerStyle}
          data-layout-header
          data-has-title={title ? '' : undefined}
        >
          <button
            onClick={openDrawer}
            aria-label="Abrir menu"
            data-hamburger-btn
            style={{
              display: isMobile ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--color-neutral-600)',
              flexShrink: 0,
              padding: 0,
              minHeight: '44px',
              minWidth: '44px',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          {title ? (
            <h1 style={headerTitleStyle}>{title}</h1>
          ) : (
            <span
              data-mobile-brand
              style={{
                display: isMobile ? 'block' : 'none',
                fontSize: 'var(--font-base)',
                fontWeight: 700,
                color: 'var(--color-neutral-800)',
                letterSpacing: '-0.01em',
              }}
            >
              Xpid
            </span>
          )}
        </header>
        <main style={mainStyle} className="page-enter">
          {children}
        </main>
      </div>
    </div>
  )
}
