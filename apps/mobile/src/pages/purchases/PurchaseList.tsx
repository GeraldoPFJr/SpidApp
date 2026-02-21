import { type CSSProperties, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { formatBRL, formatDate } from '../../lib/format'
import type { Purchase, Supplier } from '@vendi/shared'

interface PurchaseWithSupplier extends Purchase {
  supplierName: string
  itemCount: number
  totalCost: number
}

export function PurchaseListPage() {
  const navigate = useNavigate()
  const { data: purchases, loading } = useApi<PurchaseWithSupplier[]>('/purchases')
  const { data: suppliers } = useApi<Supplier[]>('/suppliers')
  const [supplierFilter, setSupplierFilter] = useState('')

  const filtered = useMemo(() => {
    if (!purchases) return []
    if (!supplierFilter) return purchases
    return purchases.filter((p) => p.supplierId === supplierFilter)
  }, [purchases, supplierFilter])

  const pageStyle: CSSProperties = {
    padding: 'var(--sp-4)',
    paddingBottom: '96px',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--sp-4)',
  }

  const filterStyle: CSSProperties = {
    width: '100%',
    padding: 'var(--sp-2) var(--sp-3)',
    fontSize: 'var(--font-base)',
    border: '1px solid var(--neutral-300)',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    backgroundColor: 'var(--surface)',
    minHeight: '44px',
    cursor: 'pointer',
  }

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
    minHeight: '56px',
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {suppliers && suppliers.length > 0 && (
        <select
          style={filterStyle}
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
        >
          <option value="">Todos os fornecedores</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--sp-12)', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, fontSize: 'var(--font-lg)', color: 'var(--neutral-700)', marginBottom: 'var(--sp-2)' }}>
            Nenhuma compra encontrada
          </p>
        </div>
      ) : (
        <div style={listGroupStyle}>
          {filtered.map((purchase, idx) => (
            <div
              key={purchase.id}
              style={{ ...itemStyle, borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
              onClick={() => navigate(`/compras/${purchase.id}`)}
            >
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 'var(--font-base)', fontWeight: 500 }}>{purchase.supplierName}</span>
                <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: '2px' }}>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{formatDate(purchase.date)}</span>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>{purchase.itemCount} itens</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <span style={{ fontSize: 'var(--font-base)', fontWeight: 600 }}>{formatBRL(purchase.totalCost)}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="fab" onClick={() => navigate('/compras/nova')} aria-label="Nova compra">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  )
}
