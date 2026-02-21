import { type CSSProperties, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { formatBRL, formatDate } from '../../lib/format'
import type { Sale } from '@vendi/shared'

interface SaleWithCustomer extends Sale {
  customerName: string | null
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  CONFIRMED: { label: 'Confirmada', bg: 'var(--success-100)', color: 'var(--success-700)' },
  DRAFT: { label: 'Rascunho', bg: 'var(--warning-100)', color: 'var(--warning-700)' },
  CANCELLED: { label: 'Cancelada', bg: 'var(--danger-100)', color: 'var(--danger-700)' },
}

type StatusFilter = 'ALL' | 'CONFIRMED' | 'DRAFT' | 'CANCELLED'

export function SaleListPage() {
  const navigate = useNavigate()
  const { data: sales, loading } = useApi<SaleWithCustomer[]>('/sales')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')

  const filtered = useMemo(() => {
    if (!sales) return []
    if (statusFilter === 'ALL') return sales
    return sales.filter((s) => s.status === statusFilter)
  }, [sales, statusFilter])

  const pageStyle: CSSProperties = {
    padding: 'var(--sp-4)',
    paddingBottom: '96px',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--sp-4)',
  }

  const filterRowStyle: CSSProperties = {
    display: 'flex',
    gap: 'var(--sp-2)',
    overflowX: 'auto',
    paddingBottom: 'var(--sp-1)',
  }

  const chipStyle = (active: boolean): CSSProperties => ({
    padding: 'var(--sp-1) var(--sp-3)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--font-sm)',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    backgroundColor: active ? 'var(--primary-100)' : 'var(--neutral-100)',
    color: active ? 'var(--primary-700)' : 'var(--neutral-700)',
    transition: 'all var(--transition-fast)',
    minHeight: '36px',
    display: 'flex',
    alignItems: 'center',
  })

  const listGroupStyle: CSSProperties = {
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
  }

  const itemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--sp-3) var(--sp-4)',
    backgroundColor: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
    minHeight: '60px',
    transition: 'background-color var(--transition-fast)',
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
    )
  }

  const filters: { value: StatusFilter; label: string }[] = [
    { value: 'ALL', label: 'Todas' },
    { value: 'CONFIRMED', label: 'Confirmadas' },
    { value: 'DRAFT', label: 'Rascunhos' },
    { value: 'CANCELLED', label: 'Canceladas' },
  ]

  return (
    <div style={pageStyle}>
      <div style={filterRowStyle}>
        {filters.map((f) => (
          <button
            key={f.value}
            style={chipStyle(statusFilter === f.value)}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--sp-12)', color: 'var(--text-muted)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto', color: 'var(--neutral-300)', marginBottom: 'var(--sp-4)' }} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" />
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
          </svg>
          <p style={{ fontWeight: 600, fontSize: 'var(--font-lg)', color: 'var(--neutral-700)', marginBottom: 'var(--sp-2)' }}>
            Nenhuma venda encontrada
          </p>
        </div>
      ) : (
        <div style={listGroupStyle}>
          {filtered.map((sale, idx) => {
            const st = STATUS_CONFIG[sale.status] ?? STATUS_CONFIG.CONFIRMED
            return (
              <div
                key={sale.id}
                style={{
                  ...itemStyle,
                  borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                }}
                onClick={() => navigate(`/vendas/${sale.id}`)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                    <span style={{ fontSize: 'var(--font-base)', fontWeight: 500 }} className="text-truncate">
                      {sale.customerName ?? 'Consumidor Final'}
                    </span>
                    <span style={{
                      padding: '2px var(--sp-2)',
                      fontSize: 'var(--font-xs)',
                      fontWeight: 500,
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: st.bg,
                      color: st.color,
                    }}>
                      {st.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: '2px' }}>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                      {formatDate(sale.date)}
                    </span>
                    {sale.couponNumber && (
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                        #{String(sale.couponNumber).padStart(6, '0')}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <span style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {formatBRL(sale.total)}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <button
        className="fab"
        onClick={() => navigate('/vendas/nova')}
        aria-label="Nova venda"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  )
}
