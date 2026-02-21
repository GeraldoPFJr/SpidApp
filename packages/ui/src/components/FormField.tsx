import type { CSSProperties, ReactNode } from 'react'
import { colors, fonts, spacing } from '../styles/theme.js'

interface FormFieldProps {
  label: string
  required?: boolean
  error?: string
  children: ReactNode
}

export function FormField({ label, required, error, children }: FormFieldProps) {
  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
  }

  const labelStyle: CSSProperties = {
    fontSize: fonts.size.sm,
    fontWeight: fonts.weight.medium,
    color: colors.neutral[700],
  }

  const requiredStyle: CSSProperties = {
    color: colors.danger[500],
    marginLeft: '2px',
  }

  const errorStyle: CSSProperties = {
    fontSize: fonts.size.xs,
    color: colors.danger[600],
  }

  return (
    <div style={containerStyle}>
      <label style={labelStyle}>
        {label}
        {required && <span style={requiredStyle}>*</span>}
      </label>
      {children}
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  )
}
