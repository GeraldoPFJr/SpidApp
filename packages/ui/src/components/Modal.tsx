import type { CSSProperties, ReactNode } from 'react'
import { colors, fonts, radius, shadows, spacing } from '../styles/theme.js'

interface ModalProps {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ open, title, children, onClose }: ModalProps) {
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

  const contentStyle: CSSProperties = {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    boxShadow: shadows.lg,
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing[4]} ${spacing[6]}`,
    borderBottom: `1px solid ${colors.neutral[200]}`,
  }

  const titleStyle: CSSProperties = {
    fontSize: fonts.size.lg,
    fontWeight: fonts.weight.semibold,
    color: colors.neutral[900],
    margin: 0,
  }

  const closeStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    fontSize: fonts.size.xl,
    color: colors.neutral[400],
    cursor: 'pointer',
    padding: spacing[1],
    lineHeight: 1,
  }

  const bodyStyle: CSSProperties = {
    padding: `${spacing[4]} ${spacing[6]}`,
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>{title}</h2>
          <button style={closeStyle} onClick={onClose} aria-label="Fechar">
            &times;
          </button>
        </div>
        <div style={bodyStyle}>{children}</div>
      </div>
    </div>
  )
}
