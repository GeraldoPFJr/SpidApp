import type { CSSProperties } from 'react'
import { colors, fonts, radius, shadows, spacing } from '../styles/theme.js'
import { Button } from './Button.js'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: spacing[4],
  }

  const dialogStyle: CSSProperties = {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    boxShadow: shadows.lg,
    width: '100%',
    maxWidth: '400px',
    padding: spacing[6],
  }

  const titleStyle: CSSProperties = {
    fontSize: fonts.size.lg,
    fontWeight: fonts.weight.semibold,
    color: colors.neutral[900],
    margin: 0,
    marginBottom: spacing[2],
  }

  const messageStyle: CSSProperties = {
    fontSize: fonts.size.sm,
    color: colors.neutral[600],
    margin: 0,
    marginBottom: spacing[6],
    lineHeight: 1.5,
  }

  const actionsStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: spacing[3],
  }

  return (
    <div style={overlayStyle} onClick={onCancel}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={titleStyle}>{title}</h3>
        <p style={messageStyle}>{message}</p>
        <div style={actionsStyle}>
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={variant} size="sm" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
