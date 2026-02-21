import type { CSSProperties, ReactNode } from 'react'
import { colors, fonts, spacing } from '../styles/theme.js'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[12],
    textAlign: 'center',
  }

  const iconStyle: CSSProperties = {
    fontSize: '3rem',
    color: colors.neutral[300],
    marginBottom: spacing[4],
  }

  const titleStyle: CSSProperties = {
    fontSize: fonts.size.lg,
    fontWeight: fonts.weight.semibold,
    color: colors.neutral[700],
    margin: 0,
    marginBottom: spacing[2],
  }

  const descStyle: CSSProperties = {
    fontSize: fonts.size.sm,
    color: colors.neutral[500],
    margin: 0,
    marginBottom: action ? spacing[4] : 0,
  }

  return (
    <div style={containerStyle}>
      {icon && <div style={iconStyle}>{icon}</div>}
      <h3 style={titleStyle}>{title}</h3>
      {description && <p style={descStyle}>{description}</p>}
      {action}
    </div>
  )
}
