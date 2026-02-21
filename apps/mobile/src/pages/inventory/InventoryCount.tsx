import { type CSSProperties, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi, useApiMutation } from '../../hooks/useApi'

interface CountableProduct {
  id: string
  name: string
  stockBase: number
}

interface CountRow {
  productId: string
  productName: string
  systemQty: number
  countedQty: string
}

export function InventoryCountPage() {
  const navigate = useNavigate()
  const { data: products } = useApi<CountableProduct[]>('/inventory/stock')
  const { execute, loading: saving } = useApiMutation('/inventory/count')
  const [rows, setRows] = useState<CountRow[]>([])
  const [search, setSearch] = useState('')

  const availableProducts = useMemo(() => {
    if (!products) return []
    const usedIds = new Set(rows.map((r) => r.productId))
    let result = products.filter((p) => !usedIds.has(p.id))
    if (search) {
      result = result.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    }
    return result.slice(0, 10)
  }, [products, rows, search])

  function addProduct(product: CountableProduct) {
    setRows((prev) => [...prev, {
      productId: product.id,
      productName: product.name,
      systemQty: product.stockBase,
      countedQty: '',
    }])
    setSearch('')
  }

  function updateCount(productId: string, value: string) {
    setRows((prev) => prev.map((r) =>
      r.productId === productId ? { ...r, countedQty: value } : r
    ))
  }

  function removeRow(productId: string) {
    setRows((prev) => prev.filter((r) => r.productId !== productId))
  }

  async function handleSubmit() {
    const adjustments = rows
      .filter((r) => r.countedQty !== '')
      .map((r) => ({
        productId: r.productId,
        countedQty: parseInt(r.countedQty, 10),
      }))
    if (adjustments.length === 0) return
    const result = await execute({ adjustments })
    if (result) navigate('/estoque', { replace: true })
  }

  const pageStyle: CSSProperties = { padding: 'var(--sp-4)', paddingBottom: '96px', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }
  const sectionStyle: CSSProperties = { backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-4)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }
  const inputStyle: CSSProperties = { width: '100%', padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--font-base)', border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-md)', outline: 'none', backgroundColor: 'var(--surface)', minHeight: '44px' }
  const dropdownStyle: CSSProperties = { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'var(--surface)', borderRadius: '0 0 var(--radius-md) var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', maxHeight: '200px', overflow: 'auto', zIndex: 20 }

  return (
    <div style={pageStyle} className="animate-fade-in">
      {/* Selecionar produtos */}
      <div style={sectionStyle}>
        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Selecionar Produtos
        </span>
        <div style={{ position: 'relative' }}>
          <input style={inputStyle} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto para contar..." />
          {search && availableProducts.length > 0 && (
            <div style={dropdownStyle}>
              {availableProducts.map((p) => (
                <div key={p.id} style={{ padding: 'var(--sp-3) var(--sp-4)', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 'var(--font-sm)' }} onClick={() => addProduct(p)}>
                  <span style={{ fontWeight: 500 }}>{p.name}</span>
                  <span style={{ marginLeft: 'var(--sp-2)', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>Sistema: {p.stockBase} un</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contagem */}
      {rows.length > 0 && (
        <div style={sectionStyle}>
          <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Contagem
          </span>

          {rows.map((row) => {
            const counted = row.countedQty !== '' ? parseInt(row.countedQty, 10) : null
            const diff = counted !== null ? counted - row.systemQty : null
            return (
              <div key={row.productId} style={{
                padding: 'var(--sp-3)', backgroundColor: 'var(--neutral-50)', borderRadius: 'var(--radius-md)',
                display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{row.productName}</span>
                  <button type="button" style={{ background: 'none', border: 'none', color: 'var(--danger-500)', cursor: 'pointer', fontSize: 'var(--font-xs)' }} onClick={() => removeRow(row.productId)}>
                    Remover
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-2)', alignItems: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Sistema</span>
                    <span style={{ fontSize: 'var(--font-lg)', fontWeight: 600 }}>{row.systemQty}</span>
                  </div>
                  <div>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block', textAlign: 'center' }}>Contagem</span>
                    <input
                      type="number"
                      style={{ ...inputStyle, textAlign: 'center', fontWeight: 600, fontSize: 'var(--font-lg)' }}
                      value={row.countedQty}
                      onChange={(e) => updateCount(row.productId, e.target.value)}
                      inputMode="numeric"
                      min={0}
                    />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', display: 'block' }}>Diferenca</span>
                    {diff !== null ? (
                      <span style={{
                        fontSize: 'var(--font-lg)', fontWeight: 600,
                        color: diff === 0 ? 'var(--success-600)' : diff > 0 ? 'var(--primary)' : 'var(--danger-600)',
                      }}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    ) : (
                      <span style={{ fontSize: 'var(--font-lg)', color: 'var(--text-muted)' }}>-</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {rows.length > 0 && (
        <button className="btn btn-primary btn-lg btn-block" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Aplicando...' : 'Aplicar Contagem'}
        </button>
      )}
    </div>
  )
}
