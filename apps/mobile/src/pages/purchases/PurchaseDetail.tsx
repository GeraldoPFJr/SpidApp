import type { CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { formatBRL, formatDate } from '../../lib/format'

interface PurchaseDetailData {
  id: string
  supplierName: string
  date: string
  notes: string | null
  status: string
  items: Array<{ id: string; productName: string; unitName: string; qty: number; unitCost: number; totalCost: number }>
  costs: Array<{ id: string; label: string; amount: number }>
  totalItems: number
  totalCosts: number
  grandTotal: number
}

export function PurchaseDetailPage() {
  const { id } = useParams()
  const { data: purchase, loading } = useApi<PurchaseDetailData>(id ? `/purchases/${id}` : null)

  const pageStyle: CSSProperties = { padding: 'var(--sp-4)', paddingBottom: '96px', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }
  const sectionStyle: CSSProperties = { backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-4)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }
  const sectionTitleStyle: CSSProperties = { fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--sp-1)' }
  const rowStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', padding: 'var(--sp-1) 0' }

  if (loading) {
    return <div style={pageStyle}>{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton skeleton-card" style={{ height: '100px' }} />)}</div>
  }

  if (!purchase) {
    return <div style={pageStyle}><div style={{ textAlign: 'center', padding: 'var(--sp-12)' }}><p style={{ fontWeight: 600, color: 'var(--neutral-700)' }}>Compra nao encontrada</p></div></div>
  }

  return (
    <div style={pageStyle} className="animate-fade-in">
      <div style={sectionStyle}>
        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, margin: 0 }}>{purchase.supplierName}</h2>
        <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>{formatDate(purchase.date)}</span>
        <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 700, color: 'var(--primary)', textAlign: 'center', padding: 'var(--sp-2) 0' }}>
          {formatBRL(purchase.grandTotal)}
        </div>
      </div>

      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Itens</span>
        {purchase.items.map((item) => (
          <div key={item.id} style={rowStyle}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 500 }}>{item.productName}</span>
              <span style={{ marginLeft: 'var(--sp-2)', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
                {item.qty} {item.unitName} x {formatBRL(item.unitCost)}
              </span>
            </div>
            <span style={{ fontWeight: 500 }}>{formatBRL(item.totalCost)}</span>
          </div>
        ))}
      </div>

      {purchase.costs.length > 0 && (
        <div style={sectionStyle}>
          <span style={sectionTitleStyle}>Custos Extras</span>
          {purchase.costs.map((cost) => (
            <div key={cost.id} style={rowStyle}>
              <span>{cost.label}</span>
              <span style={{ fontWeight: 500 }}>{formatBRL(cost.amount)}</span>
            </div>
          ))}
        </div>
      )}

      <div style={sectionStyle}>
        <div style={rowStyle}>
          <span style={{ color: 'var(--text-secondary)' }}>Itens</span>
          <span>{formatBRL(purchase.totalItems)}</span>
        </div>
        {purchase.totalCosts > 0 && (
          <div style={rowStyle}>
            <span style={{ color: 'var(--text-secondary)' }}>Custos extras</span>
            <span>{formatBRL(purchase.totalCosts)}</span>
          </div>
        )}
        <div className="divider" style={{ margin: 'var(--sp-1) 0' }} />
        <div style={{ ...rowStyle, fontWeight: 700, fontSize: 'var(--font-lg)' }}>
          <span>Total</span>
          <span style={{ color: 'var(--primary)' }}>{formatBRL(purchase.grandTotal)}</span>
        </div>
      </div>

      {purchase.notes && (
        <div style={sectionStyle}>
          <span style={sectionTitleStyle}>Observacoes</span>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)' }}>{purchase.notes}</p>
        </div>
      )}
    </div>
  )
}
