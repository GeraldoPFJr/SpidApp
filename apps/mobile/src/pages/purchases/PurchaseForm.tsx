import { type CSSProperties, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi, useApiMutation } from '../../hooks/useApi'
import { InstallmentConfig, type InstallmentPreview } from '../../components/InstallmentConfig'
import { formatBRL } from '../../lib/format'
import type { Supplier, Product, ProductUnit } from '@spid/shared'

interface ProductWithUnits extends Product {
  units: ProductUnit[]
}

interface PurchaseItemForm {
  id: string
  productId: string
  productName: string
  unitId: string
  unitLabel: string
  qty: number
  unitCost: number
}

interface ExtraCost {
  id: string
  label: string
  amount: number
}

let nextId = 1

export function PurchaseFormPage() {
  const navigate = useNavigate()
  const { data: suppliers } = useApi<Supplier[]>('/suppliers')
  const { data: products } = useApi<ProductWithUnits[]>('/products')
  const { execute, loading: saving } = useApiMutation('/purchases')

  const [supplierId, setSupplierId] = useState('')
  const [items, setItems] = useState<PurchaseItemForm[]>([])
  const [extraCosts, setExtraCosts] = useState<ExtraCost[]>([])
  const [paymentType, setPaymentType] = useState<'cash' | 'installment'>('cash')
  const [installmentPreviews, setInstallmentPreviews] = useState<InstallmentPreview[]>([])
  const [notes, setNotes] = useState('')

  // Product adding
  const [productSearch, setProductSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<ProductWithUnits | null>(null)
  const [selectedUnit, setSelectedUnit] = useState('')
  const [itemQty, setItemQty] = useState(1)
  const [itemCost, setItemCost] = useState(0)

  const filteredProducts = useMemo(() => {
    if (!products || !productSearch) return []
    const q = productSearch.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 5)
  }, [products, productSearch])

  const itemsTotal = useMemo(() => items.reduce((s, i) => s + i.qty * i.unitCost, 0), [items])
  const extraTotal = useMemo(() => extraCosts.reduce((s, c) => s + c.amount, 0), [extraCosts])
  const grandTotal = itemsTotal + extraTotal

  function selectProduct(p: ProductWithUnits) {
    setSelectedProduct(p)
    setProductSearch(p.name)
    if (p.units.length > 0) setSelectedUnit(p.units[0].id)
  }

  function addItem() {
    if (!selectedProduct || !selectedUnit || itemQty <= 0) return
    const unit = selectedProduct.units.find((u) => u.id === selectedUnit)
    if (!unit) return
    setItems((prev) => [...prev, {
      id: `pi_${nextId++}`, productId: selectedProduct.id, productName: selectedProduct.name,
      unitId: selectedUnit, unitLabel: unit.nameLabel, qty: itemQty, unitCost: itemCost,
    }])
    setSelectedProduct(null)
    setProductSearch('')
    setItemQty(1)
    setItemCost(0)
  }

  function addExtraCost() {
    setExtraCosts((prev) => [...prev, { id: `ec_${nextId++}`, label: '', amount: 0 }])
  }

  async function handleSubmit() {
    if (!supplierId || items.length === 0) return
    const payload = {
      supplierId,
      items: items.map((i) => ({ productId: i.productId, unitId: i.unitId, qty: i.qty, unitCost: i.unitCost })),
      extraCosts: extraCosts.filter((c) => c.label && c.amount > 0).map((c) => ({ label: c.label, amount: c.amount })),
      paymentType,
      installmentPreviews: paymentType === 'installment' ? installmentPreviews : undefined,
      notes: notes.trim() || null,
    }
    const result = await execute(payload)
    if (result) navigate('/compras', { replace: true })
  }

  const pageStyle: CSSProperties = { padding: 'var(--sp-4)', paddingBottom: '96px', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }
  const sectionStyle: CSSProperties = { backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-4)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }
  const sectionTitleStyle: CSSProperties = { fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }
  const labelStyle: CSSProperties = { fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--neutral-700)', marginBottom: 'var(--sp-1)', display: 'block' }
  const inputStyle: CSSProperties = { width: '100%', padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--font-base)', border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-md)', outline: 'none', backgroundColor: 'var(--surface)', minHeight: '44px' }
  const selectStyle: CSSProperties = { ...inputStyle, cursor: 'pointer' }
  const dropdownStyle: CSSProperties = { position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'var(--surface)', borderRadius: '0 0 var(--radius-md) var(--radius-md)', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', maxHeight: '200px', overflow: 'auto', zIndex: 20 }

  return (
    <div style={pageStyle} className="animate-fade-in">
      {/* Fornecedor */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Fornecedor</span>
        <select style={selectStyle} value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
          <option value="">Selecione o fornecedor</option>
          {suppliers?.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
        </select>
      </div>

      {/* Adicionar Item */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Itens</span>
        <div style={{ position: 'relative' }}>
          <input style={inputStyle} value={productSearch} onChange={(e) => { setProductSearch(e.target.value); if (selectedProduct) setSelectedProduct(null) }} placeholder="Buscar produto..." />
          {filteredProducts.length > 0 && !selectedProduct && (
            <div style={dropdownStyle}>
              {filteredProducts.map((p) => (
                <div key={p.id} style={{ padding: 'var(--sp-3) var(--sp-4)', cursor: 'pointer', borderBottom: '1px solid var(--border)', fontSize: 'var(--font-sm)' }} onClick={() => selectProduct(p)}>
                  {p.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedProduct && (
          <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            <div className="form-row">
              <div>
                <label style={labelStyle}>Unidade</label>
                <select style={selectStyle} value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)}>
                  {selectedProduct.units.map((u) => (<option key={u.id} value={u.id}>{u.nameLabel}</option>))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Quantidade</label>
                <input type="number" style={inputStyle} value={itemQty} onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value, 10) || 1))} min={1} inputMode="numeric" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-2)', alignItems: 'end' }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Custo unitario</label>
                <input type="text" inputMode="decimal" style={inputStyle} value={itemCost > 0 ? itemCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''} onChange={(e) => { const raw = e.target.value.replace(/\D/g, ''); setItemCost(parseInt(raw || '0', 10) / 100) }} placeholder="R$ 0,00" />
              </div>
              <button className="btn btn-primary btn-sm" onClick={addItem} style={{ minHeight: '44px' }}>Adicionar</button>
            </div>
          </div>
        )}

        {items.map((item) => (
          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--sp-2) 0', borderBottom: '1px solid var(--border)' }}>
            <div>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>{item.productName}</span>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginLeft: 'var(--sp-2)' }}>{item.qty} {item.unitLabel} x {formatBRL(item.unitCost)}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>{formatBRL(item.qty * item.unitCost)}</span>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--danger-500)', cursor: 'pointer', padding: 'var(--sp-1)' }} onClick={() => setItems((p) => p.filter((i) => i.id !== item.id))} aria-label="Remover">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custos Extras */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Custos Extras</span>
        {extraCosts.map((cost, idx) => (
          <div key={cost.id} className="form-row">
            <div>
              <input style={inputStyle} value={cost.label} onChange={(e) => setExtraCosts((p) => p.map((c, i) => i === idx ? { ...c, label: e.target.value } : c))} placeholder="Ex: Frete" />
            </div>
            <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
              <input type="text" inputMode="decimal" style={inputStyle} value={cost.amount > 0 ? cost.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''} onChange={(e) => { const raw = e.target.value.replace(/\D/g, ''); setExtraCosts((p) => p.map((c, i) => i === idx ? { ...c, amount: parseInt(raw || '0', 10) / 100 } : c)) }} placeholder="R$ 0,00" />
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--danger-500)', cursor: 'pointer' }} onClick={() => setExtraCosts((p) => p.filter((_, i) => i !== idx))} aria-label="Remover">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-secondary btn-sm" onClick={addExtraCost} style={{ alignSelf: 'flex-start' }}>+ Custo Extra</button>
      </div>

      {/* Pagamento */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Forma de Pagamento</span>
        <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
          {[{ value: 'cash', label: 'A Vista' }, { value: 'installment', label: 'A Prazo' }].map((opt) => (
            <button key={opt.value} style={{
              flex: 1, padding: 'var(--sp-2) var(--sp-3)', border: `1px solid ${paymentType === opt.value ? 'var(--primary)' : 'var(--neutral-300)'}`,
              borderRadius: 'var(--radius-md)', backgroundColor: paymentType === opt.value ? 'var(--primary-50)' : 'var(--surface)',
              color: paymentType === opt.value ? 'var(--primary-700)' : 'var(--text-secondary)', fontWeight: 500, fontSize: 'var(--font-sm)',
              cursor: 'pointer', minHeight: '44px', textAlign: 'center',
            }} onClick={() => setPaymentType(opt.value as 'cash' | 'installment')}>
              {opt.label}
            </button>
          ))}
        </div>
        {paymentType === 'installment' && (
          <InstallmentConfig totalAmount={grandTotal} onChange={setInstallmentPreviews} />
        )}
      </div>

      {/* Observacoes */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Observacoes</span>
        <textarea className="form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observacoes..." rows={2} />
      </div>

      {/* Total + Submit */}
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-4)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', display: 'block' }}>Total</span>
          <span style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--primary)' }}>{formatBRL(grandTotal)}</span>
        </div>
        <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={saving || !supplierId || items.length === 0}>
          {saving ? 'Salvando...' : 'Registrar Compra'}
        </button>
      </div>
    </div>
  )
}
