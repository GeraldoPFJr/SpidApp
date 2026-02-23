'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface StatsCardProps {
  title: string
  value: string
  subtitle?: string
  change?: { value: number; label?: string }
  icon?: ReactNode
  tooltip?: string
  onClick?: () => void
}

export function StatsCard({
  title,
  value,
  subtitle,
  change,
  icon,
  tooltip,
  onClick,
}: StatsCardProps) {
  const { isMobile } = useMediaQuery()

  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: isMobile ? '12px 14px' : '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: isMobile ? '4px' : '8px',
    boxShadow: 'var(--shadow-sm)',
    transition: 'all 200ms ease',
    cursor: onClick ? 'pointer' : 'default',
    position: 'relative',
    minWidth: 0,
    overflow: 'hidden',
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  }

  const titleRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    minWidth: 0,
    flex: 1,
  }

  const titleStyle: CSSProperties = {
    fontSize: isMobile ? 'var(--font-xs)' : 'var(--font-sm)',
    fontWeight: 500,
    color: 'var(--color-neutral-500)',
    margin: 0,
    lineHeight: 1.4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  const tooltipIconStyle: CSSProperties = {
    display: isMobile ? 'none' : 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: 'var(--color-neutral-100)',
    color: 'var(--color-neutral-400)',
    fontSize: '10px',
    fontWeight: 600,
    cursor: 'help',
    flexShrink: 0,
  }

  const iconContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: isMobile ? '32px' : '40px',
    height: isMobile ? '32px' : '40px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-primary-50)',
    color: 'var(--color-primary-600)',
    flexShrink: 0,
  }

  const valueStyle: CSSProperties = {
    fontSize: isMobile ? '1.25rem' : '1.75rem',
    fontWeight: 700,
    color: 'var(--color-neutral-900)',
    margin: 0,
    lineHeight: 1.2,
    letterSpacing: '-0.025em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }

  const footerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: isMobile ? '0' : '4px',
  }

  const changeStyle = (isPositive: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    fontSize: 'var(--font-xs)',
    fontWeight: 600,
    color: isPositive ? 'var(--color-success-600)' : 'var(--color-danger-600)',
  })

  const subtitleStyle: CSSProperties = {
    fontSize: 'var(--font-xs)',
    color: 'var(--color-neutral-400)',
    margin: 0,
  }

  return (
    <div
      style={cardStyle}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          const el = e.currentTarget as HTMLElement
          el.style.boxShadow = 'var(--shadow-md)'
          el.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          const el = e.currentTarget as HTMLElement
          el.style.boxShadow = 'var(--shadow-sm)'
          el.style.transform = 'translateY(0)'
        }
      }}
    >
      <div style={headerStyle}>
        <div style={titleRowStyle}>
          <p style={titleStyle}>{title}</p>
          {tooltip && (
            <span style={tooltipIconStyle} title={tooltip}>
              ?
            </span>
          )}
        </div>
        {icon && <div style={iconContainerStyle}>{icon}</div>}
      </div>

      <p style={valueStyle}>{value}</p>

      {(change || subtitle) && (
        <div style={footerStyle}>
          {change && (
            <span style={changeStyle(change.value >= 0)}>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: change.value < 0 ? 'rotate(180deg)' : 'none',
                }}
              >
                <path d="M18 15l-6-6-6 6" />
              </svg>
              {Math.abs(change.value).toFixed(1)}%
            </span>
          )}
          {subtitle && <span style={subtitleStyle}>{subtitle}</span>}
        </div>
      )}
    </div>
  )
}
