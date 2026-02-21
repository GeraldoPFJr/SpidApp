import type { CSSProperties, ReactNode } from 'react'
import { BottomNav } from './BottomNav'

interface MobileLayoutProps {
  children: ReactNode
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: '#F9FAFB',
  }

  const headerStyle: CSSProperties = {
    backgroundColor: '#2563EB',
    color: '#FFFFFF',
    padding: '16px',
    paddingTop: 'max(16px, env(safe-area-inset-top))',
    fontSize: '1.125rem',
    fontWeight: 700,
  }

  const contentStyle: CSSProperties = {
    flex: 1,
    padding: '16px',
    paddingBottom: '80px',
    overflow: 'auto',
  }

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>Vendi</header>
      <main style={contentStyle}>{children}</main>
      <BottomNav />
    </div>
  )
}
