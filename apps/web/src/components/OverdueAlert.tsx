'use client'

import { type CSSProperties } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/format'

// ─── Types ──────────────────────────────────────────────

interface OverdueAlertProps {
  count: number
  total: number
}

// ─── Component ──────────────────────────────────────────

export function OverdueAlert({ count, total }: OverdueAlertProps) {
  if (count <= 0) return null

  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    backgroundColor: 'var(--color-danger-50)',
    border: '1px solid var(--color-danger-100)',
    borderRadius: 'var(--radius-lg)',
    animation: 'fadeIn 300ms ease-out',
  }

  const leftStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  }

  const iconWrapperStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-danger-100)',
    color: 'var(--color-danger-600)',
    flexShrink: 0,
  }

  const titleStyle: CSSProperties = {
    fontWeight: 600,
    color: 'var(--color-danger-700)',
    margin: 0,
    fontSize: 'var(--font-sm)',
  }

  const subtitleStyle: CSSProperties = {
    color: 'var(--color-danger-600)',
    margin: 0,
    fontSize: 'var(--font-xs)',
  }

  const linkStyle: CSSProperties = {
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
    color: 'var(--color-danger-600)',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-danger-200)',
    backgroundColor: 'var(--color-white)',
    transition: 'all var(--transition-fast)',
  }

  return (
    <div style={containerStyle}>
      <div style={leftStyle}>
        <div style={iconWrapperStyle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div>
          <p style={titleStyle}>
            {count} cliente{count > 1 ? 's' : ''} inadimplente{count > 1 ? 's' : ''}
          </p>
          <p style={subtitleStyle}>
            Total em aberto: {formatCurrency(total)}
          </p>
        </div>
      </div>
      <Link href="/inadimplentes" style={linkStyle}>
        Ver Todos
      </Link>
    </div>
  )
}
