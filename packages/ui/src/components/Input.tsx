import type { CSSProperties, InputHTMLAttributes, ReactNode } from 'react'
import { colors, fonts, radius, spacing, transitions } from '../styles/theme.js'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

export function Input({ label, error, icon, style, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
  }

  const inputWrapperStyle: CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: `${spacing[2]} ${spacing[3]}`,
    paddingLeft: icon ? spacing[8] : spacing[3],
    fontFamily: fonts.family,
    fontSize: fonts.size.base,
    color: colors.neutral[800],
    backgroundColor: colors.neutral[0],
    border: `1px solid ${error ? colors.danger[500] : colors.neutral[300]}`,
    borderRadius: radius.md,
    outline: 'none',
    transition: `border-color ${transitions.fast}`,
    ...style,
  }

  const labelStyle: CSSProperties = {
    fontSize: fonts.size.sm,
    fontWeight: fonts.weight.medium,
    color: colors.neutral[700],
  }

  const errorStyle: CSSProperties = {
    fontSize: fonts.size.xs,
    color: colors.danger[600],
  }

  const iconStyle: CSSProperties = {
    position: 'absolute',
    left: spacing[3],
    color: colors.neutral[400],
    display: 'flex',
    pointerEvents: 'none',
  }

  return (
    <div style={containerStyle}>
      {label && (
        <label htmlFor={inputId} style={labelStyle}>
          {label}
        </label>
      )}
      <div style={inputWrapperStyle}>
        {icon && <span style={iconStyle}>{icon}</span>}
        <input id={inputId} style={inputStyle} {...props} />
      </div>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  )
}
