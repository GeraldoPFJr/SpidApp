import { type CSSProperties, type InputHTMLAttributes, useCallback } from 'react'
import { colors, fonts, radius, spacing, transitions } from '../styles/theme.js'

interface CurrencyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string
  error?: string
  value: number
  onChange: (value: number) => void
}

function formatDisplay(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export function CurrencyInput({ label, error, value, onChange, id, ...props }: CurrencyInputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  const handleChange = useCallback(
    (rawValue: string) => {
      const digits = rawValue.replace(/\D/g, '')
      const cents = parseInt(digits || '0', 10)
      onChange(cents / 100)
    },
    [onChange],
  )

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

  const prefixStyle: CSSProperties = {
    position: 'absolute',
    left: spacing[3],
    color: colors.neutral[500],
    fontSize: fonts.size.base,
    pointerEvents: 'none',
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: `${spacing[2]} ${spacing[3]}`,
    paddingLeft: spacing[8],
    fontFamily: fonts.family,
    fontSize: fonts.size.base,
    color: colors.neutral[800],
    backgroundColor: colors.neutral[0],
    border: `1px solid ${error ? colors.danger[500] : colors.neutral[300]}`,
    borderRadius: radius.md,
    outline: 'none',
    transition: `border-color ${transitions.fast}`,
    textAlign: 'right',
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
      <div style={inputWrapperStyle}>
        <span style={prefixStyle}>R$</span>
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          value={formatDisplay(Math.round(value * 100))}
          onChange={(e) => handleChange(e.target.value)}
          style={inputStyle}
          {...props}
        />
      </div>
      {error && <span style={errorStyle}>{error}</span>}
    </div>
  )
}
