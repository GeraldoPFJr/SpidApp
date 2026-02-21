import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatBRL } from '../lib/format'

interface OverdueItem {
  customerName: string
  totalOpen: number
}

interface OverdueModalProps {
  open: boolean
  items: OverdueItem[]
  onClose: () => void
}

export function OverdueModal({ open, items, onClose }: OverdueModalProps) {
  const navigate = useNavigate()

  if (!open || items.length === 0) return null

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fade-in 200ms ease both',
  }

  const contentStyle: CSSProperties = {
    width: '100%',
    maxWidth: '500px',
    backgroundColor: 'var(--surface)',
    borderTopLeftRadius: 'var(--radius-xl)',
    borderTopRightRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-xl)',
    paddingBottom: 'max(var(--sp-6), var(--safe-bottom))',
    maxHeight: '70vh',
    overflow: 'auto',
    animation: 'slide-up 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--sp-4) var(--sp-6)',
    borderBottom: '1px solid var(--border)',
  }

  const titleStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--sp-2)',
    fontSize: 'var(--font-lg)',
    fontWeight: 700,
    color: 'var(--danger-600)',
  }

  const closeBtnStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: 'var(--sp-1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  const itemStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--sp-3) var(--sp-6)',
    borderBottom: '1px solid var(--border)',
  }

  const footerStyle: CSSProperties = {
    padding: 'var(--sp-4) var(--sp-6)',
    display: 'flex',
    gap: 'var(--sp-3)',
  }

  const totalAmount = items.reduce((sum, i) => sum + i.totalOpen, 0)

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={titleStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Inadimplentes
          </div>
          <button style={closeBtnStyle} onClick={onClose} aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: 'var(--sp-3) var(--sp-6)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
            <span>{items.length} cliente{items.length !== 1 ? 's' : ''}</span>
            <span style={{ fontWeight: 600, color: 'var(--danger-600)' }}>Total: {formatBRL(totalAmount)}</span>
          </div>
        </div>

        {items.slice(0, 5).map((item, idx) => (
          <div key={idx} style={itemStyle}>
            <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>{item.customerName}</span>
            <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--danger-600)' }}>
              {formatBRL(item.totalOpen)}
            </span>
          </div>
        ))}

        {items.length > 5 && (
          <div style={{ padding: 'var(--sp-2) var(--sp-6)', fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
            e mais {items.length - 5} cliente{items.length - 5 !== 1 ? 's' : ''}...
          </div>
        )}

        <div style={footerStyle}>
          <button
            className="btn btn-danger btn-block"
            onClick={() => { onClose(); navigate('/inadimplentes') }}
          >
            Ver Todos
          </button>
          <button className="btn btn-secondary btn-block" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
