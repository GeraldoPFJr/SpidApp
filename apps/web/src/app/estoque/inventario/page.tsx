'use client'

import { type CSSProperties, useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { useApi } from '@/hooks/useApi'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { setToastFlash } from '@/hooks/useToast'
import { apiClient } from '@/lib/api'

interface InventoryProduct {
  id: string
  name: string
  stockBase: number
}

interface CountRow {
  productId: string
  productName: string
  systemStock: number
  counted: string
  difference: number
}

export default function InventarioPage() {
  const router = useRouter()
  const { isMobile } = useMediaQuery()
  const { data: products } = useApi<InventoryProduct[]>('/inventory')
  const [counts, setCounts] = useState<CountRow[]>([])
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const addProduct = useCallback((productId: string) => {
    if (counts.some((c) => c.productId === productId)) return
    const prod = products?.find((p) => p.id === productId)
    if (!prod) return
    setCounts((prev) => [...prev, {
      productId, productName: prod.name, systemStock: prod.stockBase, counted: '', difference: 0,
    }])
  }, [products, counts])

  const updateCount = useCallback((productId: string, value: string) => {
    setCounts((prev) => prev.map((c) => {
      if (c.productId !== productId) return c
      const counted = parseInt(value, 10)
      return { ...c, counted: value, difference: isNaN(counted) ? 0 : counted - c.systemStock }
    }))
  }, [])

  const removeProduct = useCallback((productId: string) => {
    setCounts((prev) => prev.filter((c) => c.productId !== productId))
  }, [])

  const handleApply = useCallback(async () => {
    const validCounts = counts.filter((c) => c.counted !== '' && c.difference !== 0)
    if (validCounts.length === 0) return
    setSaving(true)
    setSubmitError(null)
    try {
      await apiClient('/inventory/count', {
        method: 'POST',
        body: {
          items: validCounts.map((c) => ({
            productId: c.productId, countedQty: parseInt(c.counted, 10),
          })),
        },
      })
      setToastFlash('Contagem aplicada com sucesso')
      router.push('/estoque')
    } catch (error) {
      setSubmitError('Erro ao aplicar contagem. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }, [counts, router])

  const unusedProducts = useMemo(() =>
    (products ?? []).filter((p) => !counts.some((c) => c.productId === p.id)),
  [products, counts])

  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)', padding: isMobile ? '16px' : '24px', boxShadow: 'var(--shadow-sm)',
  }

  const miniInputStyle: CSSProperties = {
    padding: isMobile ? '10px 12px' : '8px 12px',
    fontSize: 'var(--font-sm)', color: 'var(--color-neutral-800)',
    backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)',
    borderRadius: 'var(--radius-md)', outline: 'none',
    width: isMobile ? '100%' : '120px',
    textAlign: 'right' as const,
    minHeight: isMobile ? '44px' : 'auto',
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px', maxWidth: '800px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.back()} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px',
            borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)', cursor: 'pointer',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <h1 style={{ fontSize: isMobile ? 'var(--font-xl)' : 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>Inventario / Contagem</h1>
        </div>

        {submitError && (
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-danger-50)', border: '1px solid var(--color-danger-100)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-700)', fontSize: 'var(--font-sm)' }}>
            {submitError}
          </div>
        )}

        {/* Add product */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 12px' }}>Adicionar Produto</h2>
          <select
            onChange={(e) => { addProduct(e.target.value); e.target.value = '' }}
            style={{
              padding: isMobile ? '10px 12px' : '8px 12px',
              fontSize: 'var(--font-sm)', color: 'var(--color-neutral-800)',
              backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)',
              borderRadius: 'var(--radius-md)', outline: 'none', cursor: 'pointer',
              width: '100%', maxWidth: isMobile ? '100%' : '400px',
              minHeight: '44px',
            }}
          >
            <option value="">Selecionar produto para contar...</option>
            {unusedProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Count table / cards */}
        {counts.length > 0 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 16px' }}>Contagem</h2>

            {isMobile ? (
              /* Mobile: stacked cards */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {counts.map((c) => (
                  <div key={c.productId} style={{
                    padding: '12px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-neutral-200)',
                    backgroundColor: 'var(--color-neutral-50)',
                    display: 'flex', flexDirection: 'column', gap: '10px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--color-neutral-900)', fontSize: 'var(--font-sm)' }}>{c.productName}</span>
                      <button onClick={() => removeProduct(c.productId)} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px',
                        borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)',
                        cursor: 'pointer', color: 'var(--color-danger-500)',
                      }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-neutral-500)' }}>Saldo Sistema</span>
                        <div style={{ fontWeight: 600, color: 'var(--color-neutral-700)' }}>{c.systemStock.toLocaleString('pt-BR')}</div>
                      </div>
                      <div>
                        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-neutral-500)' }}>Contagem</span>
                        <input type="number" value={c.counted} onChange={(e) => updateCount(c.productId, e.target.value)} min="0" style={miniInputStyle} placeholder="0" />
                      </div>
                    </div>
                    <div style={{
                      textAlign: 'center', fontWeight: 700, fontSize: 'var(--font-sm)',
                      color: c.difference > 0 ? 'var(--color-success-600)' : c.difference < 0 ? 'var(--color-danger-600)' : 'var(--color-neutral-400)',
                      padding: '8px', borderRadius: 'var(--radius-sm)',
                      backgroundColor: c.difference > 0 ? 'var(--color-success-50)' : c.difference < 0 ? 'var(--color-danger-50)' : 'var(--color-neutral-100)',
                    }}>
                      Diferenca: {c.counted === '' ? '-' : (c.difference > 0 ? '+' : '') + c.difference.toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop: table */
              <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-sm)' }}>
                  <thead>
                    <tr>
                      {['Produto', 'Saldo Sistema', 'Contagem', 'Diferenca', ''].map((h, i) => (
                        <th key={h || 'x'} style={{
                          padding: '10px 16px',
                          textAlign: i >= 1 && i <= 3 ? 'right' : 'left',
                          fontWeight: 500, color: 'var(--color-neutral-500)',
                          backgroundColor: 'var(--color-neutral-50)',
                          borderBottom: '1px solid var(--color-border)',
                          fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {counts.map((c) => (
                      <tr key={c.productId}>
                        <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', fontWeight: 500 }}>{c.productName}</td>
                        <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', textAlign: 'right' }}>{c.systemStock.toLocaleString('pt-BR')}</td>
                        <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', textAlign: 'right' }}>
                          <input type="number" value={c.counted} onChange={(e) => updateCount(c.productId, e.target.value)} min="0" style={miniInputStyle} placeholder="0" />
                        </td>
                        <td style={{
                          padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', textAlign: 'right',
                          fontWeight: 700,
                          color: c.difference > 0 ? 'var(--color-success-600)' : c.difference < 0 ? 'var(--color-danger-600)' : 'var(--color-neutral-400)',
                        }}>
                          {c.counted === '' ? '-' : (c.difference > 0 ? '+' : '') + c.difference.toLocaleString('pt-BR')}
                        </td>
                        <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', textAlign: 'center' }}>
                          <button onClick={() => removeProduct(c.productId)} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px',
                            borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)',
                            cursor: 'pointer', color: 'var(--color-danger-500)',
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="form-actions">
              <button onClick={() => router.back()} style={{ padding: '10px 20px', fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)', cursor: 'pointer', minHeight: '44px' }}>Cancelar</button>
              <button onClick={handleApply} disabled={saving} style={{
                padding: '10px 24px', fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--color-white)',
                backgroundColor: 'var(--color-primary-600)', border: 'none', borderRadius: 'var(--radius-md)',
                cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
                minHeight: '44px',
              }}>
                {saving ? 'Aplicando...' : 'Aplicar Contagem'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
