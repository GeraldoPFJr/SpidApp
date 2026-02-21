import type { CSSProperties, ReactNode } from 'react'
import { colors, fonts, spacing } from '../styles/theme.js'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing[4],
    marginBottom: spacing[6],
    flexWrap: 'wrap',
  }

  const textStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
  }

  const titleStyle: CSSProperties = {
    fontSize: fonts.size['2xl'],
    fontWeight: fonts.weight.bold,
    color: colors.neutral[900],
    margin: 0,
  }

  const subtitleStyle: CSSProperties = {
    fontSize: fonts.size.sm,
    color: colors.neutral[500],
    margin: 0,
  }

  const actionsStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  }

  return (
    <div style={containerStyle}>
      <div style={textStyle}>
        <h1 style={titleStyle}>{title}</h1>
        {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
      </div>
      {actions && <div style={actionsStyle}>{actions}</div>}
    </div>
  )
}
