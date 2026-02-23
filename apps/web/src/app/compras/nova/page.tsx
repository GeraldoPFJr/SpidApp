'use client'

import { type CSSProperties, useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import type { Supplier, Product, ProductUnit } from '@spid/shared'

interface PurchaseItemRow {
  id: string
  productId: string
  unitId: string
  qty: string
  unitCost: string
}

interface ExtraCostRow {
  id: string
  label: string
  amount: string
}

interface ProductOption extends Product {
  units?: ProductUnit[]
}

export default function NovaCompraPage() {
  const router = useRouter()
  const { data: suppliers } = useApi<Supplier[]>('/suppliers')
  const { data: products } = useApi<ProductOption[]>('/products')

  const [supplierId, setSupplierId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<PurchaseItemRow[]>([{ id: crypto.randomUUID(), productId: '', unitId: '', qty: '1', unitCost: '' }])
  const [extraCosts, setExtraCosts] = useState<ExtraCostRow[]>([{ id: crypto.randomUUID(), label: '', amount: '' }])
  const [paymentType, setPaymentType] = useState<'cash' | 'installment'>('cash')
  const [installments, setInstallments] = useState('1')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { id: crypto.randomUUID(), productId: '', unitId: '', qty: '1', unitCost: '' }])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const filtered = prev.filter((i) => i.id !== id)
      return filtered.length === 0 ? [{ id: crypto.randomUUID(), productId: '', unitId: '', qty: '1', unitCost: '' }] : filtered
    })
  }, [])

  const updateItem = useCallback((id: string, field: keyof PurchaseItemRow, value: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)))
  }, [])

  const addExtraCost = useCallback(() => {
    setExtraCosts((prev) => [...prev, { id: crypto.randomUUID(), label: '', amount: '' }])
  }, [])

  const removeExtraCost = useCallback((id: string) => {
    setExtraCosts((prev) => {
      const filtered = prev.filter((c) => c.id !== id)
      return filtered.length === 0 ? [{ id: crypto.randomUUID(), label: '', amount: '' }] : filtered
    })
  }, [])

  const updateExtraCost = useCallback((id: string, field: keyof ExtraCostRow, value: string) => {
    setExtraCosts((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)))
  }, [])

  const itemsTotal = useMemo(() =>
    items.reduce((sum, i) => {
      const qty = parseFloat(i.qty.replace(',', '.')) || 0
      const cost = parseFloat(i.unitCost.replace(',', '.')) || 0
      return sum + qty * cost
    }, 0),
  [items])

  const extraTotal = useMemo(() =>
    extraCosts.reduce((sum, c) => sum + (parseFloat(c.amount.replace(',', '.')) || 0), 0),
  [extraCosts])

  const grandTotal = itemsTotal + extraTotal

  const handleSubmit = useCallback(async () => {
    const errs: Record<string, string> = {}
    const validItems = items.filter((i) => i.productId)
    if (!supplierId) errs.supplierId = 'Selecione um fornecedor'
    if (validItems.length === 0) errs.items = 'Adicione ao menos um item'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return
    setSaving(true)
    try {
      await apiClient('/purchases', {
        method: 'POST',
        body: {
          supplierId, date, notes: notes || null,
          items: validItems.map((i) => {
            const qty = parseFloat(i.qty.replace(',', '.')) || 0
            const unitCost = parseFloat(i.unitCost.replace(',', '.')) || 0
            return {
              productId: i.productId, unitId: i.unitId,
              qty, unitCost, totalCost: qty * unitCost,
            }
          }),
          costs: extraCosts.filter((c) => c.label && c.amount).map((c) => ({
            label: c.label, amount: parseFloat(c.amount.replace(',', '.')) || 0,
          })),
        },
      })
      router.push('/compras')
    } catch {
      setErrors({ submit: 'Erro ao salvar compra. Tente novamente.' })
    } finally {
      setSaving(false)
    }
  }, [supplierId, date, notes, items, extraCosts, paymentType, installments, router])

  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)', padding: '24px', boxShadow: 'var(--shadow-sm)',
  }

  const miniInputStyle: CSSProperties = {
    padding: '6px 10px', fontSize: 'var(--font-sm)', color: 'var(--color-neutral-800)',
    backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)',
    borderRadius: 'var(--radius-sm)', outline: 'none', width: '100%',
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '960px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.back()} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px',
            borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)', cursor: 'pointer',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>Nova Compra</h1>
        </div>

        {errors.submit && (
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-danger-50)', border: '1px solid var(--color-danger-100)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-700)', fontSize: 'var(--font-sm)' }}>
            {errors.submit}
          </div>
        )}

        {/* Header */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 16px' }}>Cabecalho</h2>
          <div className="form-grid-3">
            <div>
              <label style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-700)', marginBottom: '4px', display: 'block' }}>Fornecedor *</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={{ ...miniInputStyle, cursor: 'pointer' }}>
                <option value="">Selecione...</option>
                {suppliers?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-700)', marginBottom: '4px', display: 'block' }}>Data</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={miniInputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-700)', marginBottom: '4px', display: 'block' }}>Observacao</label>
              <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" style={miniInputStyle} />
            </div>
          </div>
        </div>

        {/* Items */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: 0 }}>Itens</h2>
            <button onClick={addItem} style={{ padding: '4px 12px', fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-primary-600)', backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
              + Adicionar Item
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {items.map((item) => {
              const prod = products?.find((p) => p.id === item.productId)
              const qty = parseFloat(item.qty.replace(',', '.')) || 0
              const cost = parseFloat(item.unitCost.replace(',', '.')) || 0
              return (
                <div key={item.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 80px 120px 100px 40px', gap: '8px', padding: '8px 0', alignItems: 'center', borderBottom: '1px solid var(--color-neutral-100)' }}>
                  <select value={item.productId} onChange={(e) => updateItem(item.id, 'productId', e.target.value)} style={miniInputStyle}>
                    <option value="">Produto...</option>
                    {products?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <select value={item.unitId} onChange={(e) => updateItem(item.id, 'unitId', e.target.value)} style={miniInputStyle} disabled={!item.productId}>
                    <option value="">Unid.</option>
                    {prod?.units?.map((u) => <option key={u.id} value={u.id}>{u.nameLabel}</option>)}
                  </select>
                  <input type="text" value={item.qty} onChange={(e) => updateItem(item.id, 'qty', e.target.value)} style={{ ...miniInputStyle, textAlign: 'center' }} placeholder="Qtd" />
                  <input type="text" value={item.unitCost} onChange={(e) => updateItem(item.id, 'unitCost', e.target.value)} style={{ ...miniInputStyle, textAlign: 'right' }} placeholder="Custo unit." />
                  <span style={{ textAlign: 'right', fontWeight: 600, fontSize: 'var(--font-sm)' }}>{formatCurrency(qty * cost)}</span>
                  {items.length > 1 ? (
                    <button onClick={() => removeItem(item.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)', cursor: 'pointer', color: 'var(--color-danger-500)' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                  ) : <span />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Extra Costs */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: 0 }}>Custos Extras</h2>
            <button onClick={addExtraCost} style={{ padding: '4px 12px', fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-primary-600)', backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
              + Adicionar Custo
            </button>
          </div>
          {extraCosts.map((c) => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 40px', gap: '8px', padding: '8px 0', alignItems: 'center', borderBottom: '1px solid var(--color-neutral-100)' }}>
              <input type="text" value={c.label} onChange={(e) => updateExtraCost(c.id, 'label', e.target.value)} placeholder="Ex: Frete" style={miniInputStyle} />
              <input type="text" value={c.amount} onChange={(e) => updateExtraCost(c.id, 'amount', e.target.value)} placeholder="0,00" style={{ ...miniInputStyle, textAlign: 'right' }} />
              {extraCosts.length > 1 ? (
                <button onClick={() => removeExtraCost(c.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)', cursor: 'pointer', color: 'var(--color-danger-500)' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              ) : <span />}
            </div>
          ))}
        </div>

        {/* Payment + Total */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 16px' }}>Pagamento</h2>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-sm)', cursor: 'pointer' }}>
                <input type="radio" checked={paymentType === 'cash'} onChange={() => setPaymentType('cash')} style={{ accentColor: 'var(--color-primary-600)' }} /> A vista
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-sm)', cursor: 'pointer' }}>
                <input type="radio" checked={paymentType === 'installment'} onChange={() => setPaymentType('installment')} style={{ accentColor: 'var(--color-primary-600)' }} /> A prazo
              </label>
              {paymentType === 'installment' && (
                <div style={{ marginLeft: '24px' }}>
                  <label style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)', display: 'block', marginBottom: '4px' }}>Parcelas</label>
                  <input type="number" value={installments} onChange={(e) => setInstallments(e.target.value)} min="1" max="24" style={{ ...miniInputStyle, width: '80px', textAlign: 'center' }} />
                </div>
              )}
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', marginBottom: '4px' }}>Itens: {formatCurrency(itemsTotal)}</div>
              {extraTotal > 0 && <div style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', marginBottom: '4px' }}>Custos extras: {formatCurrency(extraTotal)}</div>}
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-neutral-900)' }}>Total: {formatCurrency(grandTotal)}</div>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button onClick={() => router.back()} style={{ padding: '10px 20px', fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving || !supplierId || !items.some((i) => i.productId)} style={{
            padding: '10px 24px', fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--color-white)',
            backgroundColor: 'var(--color-primary-600)', border: 'none', borderRadius: 'var(--radius-md)',
            cursor: (saving || !supplierId || !items.some((i) => i.productId)) ? 'not-allowed' : 'pointer',
            opacity: (saving || !supplierId || !items.some((i) => i.productId)) ? 0.5 : 1,
          }}>
            {saving ? 'Salvando...' : 'Salvar Compra'}
          </button>
        </div>
      </div>
    </Layout>
  )
}
