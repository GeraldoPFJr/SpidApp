import type { CSSProperties, InputHTMLAttributes } from 'react'
import { colors, fonts, radius, spacing, transitions } from '../styles/theme.js'

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
}

export function DatePicker({ label, error, id, style, ...props }: DatePickerProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: `${spacing[2]} ${spacing[3]}`,
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

  return (
    <div style={containerStyle}>
      {label && (
        <label htmlFor={inputId} style={labelStyle}>
          {label}
        </label>
      )}
      <input id={inputId} type="date" style={inputStyle} {...props} />
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  )
}
