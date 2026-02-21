import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { colors, fonts, radius, spacing, transitions } from '../styles/theme.js'

interface SearchInputProps {
  value?: string
  placeholder?: string
  debounceMs?: number
  onChange: (value: string) => void
}

export function SearchInput({
  value: externalValue,
  placeholder = 'Buscar...',
  debounceMs = 300,
  onChange,
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(externalValue ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (externalValue !== undefined) {
      setInternalValue(externalValue)
    }
  }, [externalValue])

  function handleChange(newValue: string) {
    setInternalValue(newValue)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(newValue), debounceMs)
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: `${spacing[2]} ${spacing[3]}`,
    paddingLeft: spacing[8],
    fontFamily: fonts.family,
    fontSize: fonts.size.base,
    color: colors.neutral[800],
    backgroundColor: colors.neutral[0],
    border: `1px solid ${colors.neutral[300]}`,
    borderRadius: radius.md,
    outline: 'none',
    transition: `border-color ${transitions.fast}`,
  }

  const wrapperStyle: CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  }

  const iconStyle: CSSProperties = {
    position: 'absolute',
    left: spacing[3],
    color: colors.neutral[400],
    pointerEvents: 'none',
    fontSize: fonts.size.sm,
  }

  return (
    <div style={wrapperStyle}>
      <span style={iconStyle}>&#128269;</span>
      <input
        type="text"
        value={internalValue}
        placeholder={placeholder}
        onChange={(e) => handleChange(e.target.value)}
        style={inputStyle}
      />
    </div>
  )
}
