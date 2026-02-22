import { type CSSProperties, useMemo, useState } from 'react'
import { useApi } from '../hooks/useApi'
import { formatBRL, formatDate } from '../lib/format'

interface OverdueCustomer {
  customerId: string
  customerName: string
  totalOpen: number
  overdueCount: number
  daysOverdue: number
  lastPurchaseDate: string | null
  receivables: Array<{
    id: string
    amount: number
    dueDate: string
    kind: string
  }>
}

type SortField = 'daysOverdue' | 'totalOpen' | 'customerName'

export function InadimplentesPage() {
  const { data: overdues, loading, error } = useApi<OverdueCustomer[]>('/receivables/overdue')
  const [sortBy, setSortBy] = useState<SortField>('daysOverdue')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sorted = useMemo(() => {
    if (!overdues) return []
    return [...overdues].sort((a, b) => {
      if (sortBy === 'daysOverdue') return b.daysOverdue - a.daysOverdue
      if (sortBy === 'totalOpen') return b.totalOpen - a.totalOpen
      return a.customerName.localeCompare(b.customerName)
    })
  }, [overdues, sortBy])

  const pageStyle: CSSProperties = { padding: 'var(--sp-4)', paddingBottom: '96px', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }
  const chipStyle = (active: boolean): CSSProperties => ({
    padding: 'var(--sp-1) var(--sp-3)', borderRadius: 'var(--radius-full)',
    fontSize: 'var(--font-sm)', fontWeight: 500, border: 'none', cursor: 'pointer',
    backgroundColor: active ? 'var(--primary-100)' : 'var(--neutral-100)',
    color: active ? 'var(--primary-700)' : 'var(--neutral-700)',
    transition: 'all var(--transition-fast)', whiteSpace: 'nowrap', minHeight: '36px',
    display: 'flex', alignItems: 'center',
  })

  if (loading) {
    return <div style={pageStyle}>{Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton skeleton-card" />)}</div>
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <div className="alert alert-danger">
          <span>Erro ao carregar inadimplentes: {error}</span>
        </div>
      </div>
    )
  }

  if (!sorted.length) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', padding: 'var(--sp-12)', color: 'var(--text-muted)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'var(--success-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--sp-4)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--success-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p style={{ fontWeight: 600, fontSize: 'var(--font-lg)', color: 'var(--neutral-700)', marginBottom: 'var(--sp-2)' }}>Nenhum inadimplente!</p>
          <p style={{ fontSize: 'var(--font-sm)' }}>Todos os pagamentos estao em dia.</p>
        </div>
      </div>
    )
  }

  const sortOptions: { value: SortField; label: string }[] = [
    { value: 'daysOverdue', label: 'Dias atraso' },
    { value: 'totalOpen', label: 'Valor' },
    { value: 'customerName', label: 'Nome' },
  ]

  const KIND_LABELS: Record<string, string> = { CREDIARIO: 'Crediario', BOLETO: 'Boleto', CHEQUE: 'Cheque', CARD_INSTALLMENT: 'Cartao' }

  return (
    <div style={pageStyle}>
      {/* Ordenacao */}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', overflowX: 'auto' }}>
        {sortOptions.map((opt) => (
          <button key={opt.value} style={chipStyle(sortBy === opt.value)} onClick={() => setSortBy(opt.value)}>
            {opt.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
        {sorted.map((item, idx) => {
          const isExpanded = expandedId === item.customerId
          return (
            <div key={item.customerId}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: 'var(--sp-3) var(--sp-4)', backgroundColor: 'var(--surface)',
                  borderBottom: (idx < sorted.length - 1 || isExpanded) ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer', minHeight: '64px',
                }}
                onClick={() => setExpandedId(isExpanded ? null : item.customerId)}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 'var(--font-base)', fontWeight: 500, display: 'block' }} className="text-truncate">
                    {item.customerName}
                  </span>
                  <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: '2px', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    <span>{item.overdueCount} nota{item.overdueCount !== 1 ? 's' : ''}</span>
                    <span>{item.daysOverdue} dia{item.daysOverdue !== 1 ? 's' : ''} atraso</span>
                    {item.lastPurchaseDate && <span>Ultima: {formatDate(item.lastPurchaseDate)}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <span style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--danger-600)' }}>
                    {formatBRL(item.totalOpen)}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform var(--transition-fast)' }}>
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </div>
              </div>

              {isExpanded && (
                <div style={{ backgroundColor: 'var(--neutral-50)', padding: 'var(--sp-3) var(--sp-4)', borderBottom: idx < sorted.length - 1 ? '1px solid var(--border)' : 'none' }}
                  className="animate-slide-down">
                  {item.receivables.map((rec) => (
                    <div key={rec.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: 'var(--sp-2) 0', borderBottom: '1px solid var(--border)',
                    }}>
                      <div>
                        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>{formatBRL(rec.amount)}</span>
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginLeft: 'var(--sp-2)' }}>
                          {formatDate(rec.dueDate)} - {KIND_LABELS[rec.kind] ?? rec.kind}
                        </span>
                      </div>
                      <button className="btn btn-primary btn-sm" style={{ minHeight: '32px' }}>
                        Receber
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
