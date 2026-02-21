import type { CSSProperties, SelectHTMLAttributes } from 'react'
import { colors, fonts, radius, spacing, transitions } from '../styles/theme.js'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export function Select({ label, error, options, placeholder, style, id, ...props }: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: spacing[1],
  }

  const selectStyle: CSSProperties = {
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
    cursor: 'pointer',
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
        <label htmlFor={selectId} style={labelStyle}>
          {label}
        </label>
      )}
      <select id={selectId} style={selectStyle} {...props}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  )
}
