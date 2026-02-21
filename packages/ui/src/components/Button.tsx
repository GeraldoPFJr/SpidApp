import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { colors, fonts, radius, spacing, transitions } from '../styles/theme.js'

type ButtonVariant = 'primary' | 'secondary' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  children: ReactNode
}

const variantStyles: Record<ButtonVariant, CSSProperties> = {
  primary: {
    backgroundColor: colors.primary[600],
    color: colors.neutral[0],
    border: 'none',
  },
  secondary: {
    backgroundColor: colors.neutral[0],
    color: colors.neutral[700],
    border: `1px solid ${colors.neutral[300]}`,
  },
  danger: {
    backgroundColor: colors.danger[600],
    color: colors.neutral[0],
    border: 'none',
  },
}

const sizeStyles: Record<ButtonSize, CSSProperties> = {
  sm: { padding: `${spacing[1]} ${spacing[3]}`, fontSize: fonts.size.sm },
  md: { padding: `${spacing[2]} ${spacing[4]}`, fontSize: fonts.size.base },
  lg: { padding: `${spacing[3]} ${spacing[6]}`, fontSize: fonts.size.lg },
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const baseStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    fontFamily: fonts.family,
    fontWeight: fonts.weight.medium,
    borderRadius: radius.md,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: `all ${transitions.fast}`,
    lineHeight: 1.5,
    ...variantStyles[variant],
    ...sizeStyles[size],
    ...style,
  }

  return (
    <button style={baseStyle} disabled={disabled} {...props}>
      {children}
    </button>
  )
}
