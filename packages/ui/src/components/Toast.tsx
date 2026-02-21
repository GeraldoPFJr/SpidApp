import type { CSSProperties } from 'react'
import { colors, fonts, radius, shadows, spacing } from '../styles/theme.js'

type ToastVariant = 'success' | 'error' | 'warning'

interface ToastProps {
  message: string
  variant?: ToastVariant
  visible: boolean
  onClose: () => void
}

const variantStyles: Record<ToastVariant, CSSProperties> = {
  success: { backgroundColor: colors.success[600], color: colors.neutral[0] },
  error: { backgroundColor: colors.danger[600], color: colors.neutral[0] },
  warning: { backgroundColor: colors.warning[600], color: colors.neutral[0] },
}

export function Toast({ message, variant = 'success', visible, onClose }: ToastProps) {
  if (!visible) return null

  const style: CSSProperties = {
    position: 'fixed',
    bottom: spacing[6],
    right: spacing[6],
    display: 'flex',
    alignItems: 'center',
    gap: spacing[3],
    padding: `${spacing[3]} ${spacing[4]}`,
    borderRadius: radius.md,
    boxShadow: shadows.lg,
    fontFamily: fonts.family,
    fontSize: fonts.size.sm,
    fontWeight: fonts.weight.medium,
    zIndex: 2000,
    ...variantStyles[variant],
  }

  const closeStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    fontSize: fonts.size.lg,
    lineHeight: 1,
    opacity: 0.8,
    padding: 0,
  }

  return (
    <div style={style}>
      <span>{message}</span>
      <button style={closeStyle} onClick={onClose} aria-label="Fechar">
        &times;
      </button>
    </div>
  )
}
