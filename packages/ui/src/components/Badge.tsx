import type { CSSProperties } from 'react'
import { colors, fonts, radius, spacing } from '../styles/theme.js'

type BadgeVariant = 'default' | 'success' | 'danger' | 'warning' | 'primary'

interface BadgeProps {
  label: string
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, CSSProperties> = {
  default: { backgroundColor: colors.neutral[100], color: colors.neutral[700] },
  success: { backgroundColor: colors.success[100], color: colors.success[700] },
  danger: { backgroundColor: colors.danger[100], color: colors.danger[700] },
  warning: { backgroundColor: colors.warning[100], color: colors.warning[700] },
  primary: { backgroundColor: colors.primary[100], color: colors.primary[700] },
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const style: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: `2px ${spacing[2]}`,
    fontSize: fonts.size.xs,
    fontWeight: fonts.weight.medium,
    borderRadius: radius.full,
    lineHeight: 1.5,
    ...variantStyles[variant],
  }

  return <span style={style}>{label}</span>
}
