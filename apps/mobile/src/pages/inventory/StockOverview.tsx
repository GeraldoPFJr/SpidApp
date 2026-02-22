import { type CSSProperties, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'

interface StockItem {
  productId: string
  productName: string
  stockBase: number
  minStock: number | null
  units: Array<{ nameLabel: string; factorToBase: number }>
}

export function StockOverviewPage() {
  const navigate = useNavigate()
  const { data: items, loading, error } = useApi<StockItem[]>('/inventory/stock')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!items) return []
    if (!search) return items
    return items.filter((i) => i.productName.toLowerCase().includes(search.toLowerCase()))
  }, [items, search])

  const pageStyle: CSSProperties = { padding: 'var(--sp-4)', paddingBottom: '96px', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }
  const searchStyle: CSSProperties = { width: '100%', padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--font-base)', border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-md)', outline: 'none', backgroundColor: 'var(--surface)', minHeight: '44px' }
  const listGroupStyle: CSSProperties = { borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }

  const btnRowStyle: CSSProperties = { display: 'flex', gap: 'var(--sp-2)' }

  if (loading) {
    return <div style={pageStyle}>{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton skeleton-card" />)}</div>
  }

  return (
    <div style={pageStyle}>
      {error && (
        <div className="alert alert-danger">
          <span>Erro ao carregar estoque: {error}</span>
        </div>
      )}

      <div style={btnRowStyle}>
        <button className="btn btn-secondary btn-block btn-sm" onClick={() => navigate('/estoque/movimentacoes')}>
          Movimentacoes
        </button>
        <button className="btn btn-primary btn-block btn-sm" onClick={() => navigate('/estoque/contagem')}>
          Contagem
        </button>
      </div>

      <input type="text" placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} style={searchStyle} />

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--sp-12)', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, fontSize: 'var(--font-lg)', color: 'var(--neutral-700)' }}>Nenhum produto em estoque</p>
        </div>
      ) : (
        <div style={listGroupStyle}>
          {filtered.map((item, idx) => {
            const isLow = item.minStock != null && item.stockBase < item.minStock
            return (
              <div key={item.productId} style={{
                padding: 'var(--sp-3) var(--sp-4)', backgroundColor: 'var(--surface)',
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--font-base)', fontWeight: 500 }}>{item.productName}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                    <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: isLow ? 'var(--danger-600)' : 'var(--text-primary)' }}>
                      {item.stockBase}
                    </span>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>un</span>
                    {isLow && <span className="badge badge-danger" style={{ fontSize: '10px' }}>Baixo</span>}
                  </div>
                </div>
                {item.units.length > 0 && (
                  <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: 'var(--sp-1)', flexWrap: 'wrap' }}>
                    {item.units.map((u) => (
                      <span key={u.nameLabel} style={{
                        fontSize: 'var(--font-xs)', color: 'var(--text-secondary)',
                        backgroundColor: 'var(--neutral-100)', padding: '2px var(--sp-2)',
                        borderRadius: 'var(--radius-full)',
                      }}>
                        {Math.floor(item.stockBase / u.factorToBase)} {u.nameLabel}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
