import { type CSSProperties, useCallback, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApi, useApiMutation } from '../../hooks/useApi'
import { PaymentSplit, type PaymentEntry } from '../../components/PaymentSplit'
import { formatBRL } from '../../lib/format'
import type { Customer, Product, ProductUnit, Account } from '@vendi/shared'

// ─── Types ─────────────────────────────────────────────────
interface ProductWithUnits extends Product {
  units: (ProductUnit & { defaultPrice?: number })[]
}

interface SaleItem {
  id: string
  productId: string
  productName: string
  unitId: string
  unitLabel: string
  qty: number
  unitPrice: number
}

// ─── Step indicator ────────────────────────────────────────
function Stepper({ current }: { current: number }) {
  const steps = ['Itens', 'Pagamento', 'Confirmar']
  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--sp-2)',
    padding: 'var(--sp-3) 0',
  }

  return (
    <div style={containerStyle}>
      {steps.map((label, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
          {i > 0 && (
            <div style={{
              width: '24px', height: '2px',
              backgroundColor: i <= current ? 'var(--success-500)' : 'var(--neutral-200)',
              transition: 'background-color var(--transition-normal)',
            }} />
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--font-xs)', fontWeight: 600,
              backgroundColor: i < current ? 'var(--success-500)' : i === current ? 'var(--primary)' : 'var(--neutral-200)',
              color: i <= current ? 'var(--neutral-0)' : 'var(--neutral-500)',
              transition: 'all var(--transition-normal)',
            }}>
              {i < current ? '\u2713' : i + 1}
            </div>
            <span style={{
              fontSize: '10px', fontWeight: 500,
              color: i === current ? 'var(--primary)' : 'var(--text-secondary)',
            }}>
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────
let nextItemId = 1

export function NewSalePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedCustomerId = searchParams.get('customerId') ?? ''

  const [step, setStep] = useState(0)
  const [customerId, setCustomerId] = useState(preselectedCustomerId)
  const [customerSearch, setCustomerSearch] = useState('')
  const [items, setItems] = useState<SaleItem[]>([])
  const [discount, setDiscount] = useState(0)
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('fixed')
  const [surcharge, setSurcharge] = useState(0)
  const [freight, setFreight] = useState(0)
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const [showSuccess, setShowSuccess] = useState(false)

  // Product search for adding items
  const [productSearch, setProductSearch] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<ProductWithUnits | null>(null)
  const [selectedUnit, setSelectedUnit] = useState('')
  const [itemQty, setItemQty] = useState(1)
  const [itemPrice, setItemPrice] = useState(0)

  // API
  const { data: customers } = useApi<Customer[]>('/customers')
  const { data: products } = useApi<ProductWithUnits[]>('/products')
  const { data: accounts } = useApi<Account[]>('/accounts')
  const { execute: submitSale, loading: saving } = useApiMutation('/sales')

  // ─── Calculations ──────────────────────────────────────
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0),
    [items]
  )

  const discountAmount = useMemo(
    () => discountType === 'percent' ? subtotal * (discount / 100) : discount,
    [subtotal, discount, discountType]
  )

  const total = useMemo(
    () => Math.max(0, subtotal - discountAmount + surcharge + freight),
    [subtotal, discountAmount, surcharge, freight]
  )

  // ─── Customer data ─────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    if (!customers || !customerSearch) return []
    const q = customerSearch.toLowerCase()
    return customers.filter((c) =>
      c.name.toLowerCase().includes(q) || (c.phone && c.phone.includes(q))
    ).slice(0, 5)
  }, [customers, customerSearch])

  const selectedCustomer = useMemo(() => {
    if (!customerId || !customers) return null
    return customers.find((c) => c.id === customerId) ?? null
  }, [customerId, customers])

  // ─── Product search ────────────────────────────────────
  const filteredProducts = useMemo(() => {
    if (!products || !productSearch) return []
    const q = productSearch.toLowerCase()
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) || (p.code && p.code.toLowerCase().includes(q))
    ).slice(0, 5)
  }, [products, productSearch])

  function selectProduct(product: ProductWithUnits) {
    setSelectedProduct(product)
    setProductSearch(product.name)
    if (product.units.length > 0) {
      setSelectedUnit(product.units[0].id)
      setItemPrice(product.units[0].defaultPrice ?? 0)
    }
    setItemQty(1)
  }

  function addItem() {
    if (!selectedProduct || !selectedUnit || itemQty <= 0) return
    const unit = selectedProduct.units.find((u) => u.id === selectedUnit)
    if (!unit) return

    setItems((prev) => [
      ...prev,
      {
        id: `item_${nextItemId++}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        unitId: selectedUnit,
        unitLabel: unit.nameLabel,
        qty: itemQty,
        unitPrice: itemPrice,
      },
    ])

    setSelectedProduct(null)
    setProductSearch('')
    setSelectedUnit('')
    setItemQty(1)
    setItemPrice(0)
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const handlePaymentsChange = useCallback(
    (newPayments: PaymentEntry[]) => setPayments(newPayments),
    []
  )

  // ─── Submit ────────────────────────────────────────────
  async function handleConfirm() {
    const payload = {
      customerId: customerId || null,
      items: items.map((i) => ({
        productId: i.productId,
        unitId: i.unitId,
        qty: i.qty,
        unitPrice: i.unitPrice,
      })),
      discount: discountAmount,
      surcharge,
      freight,
      payments: payments.map((p) => ({
        method: p.method,
        amount: p.amount,
        accountId: p.accountId,
        installments: p.installments,
        installmentPreviews: p.installmentPreviews,
      })),
    }
    const result = await submitSale(payload)
    if (result) {
      setShowSuccess(true)
    }
  }

  // ─── Styles ────────────────────────────────────────────
  const pageStyle: CSSProperties = {
    padding: 'var(--sp-4)',
    paddingBottom: '96px',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--sp-4)',
  }

  const sectionStyle: CSSProperties = {
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--sp-4)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--sp-3)',
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const labelStyle: CSSProperties = {
    fontSize: 'var(--font-xs)',
    fontWeight: 500,
    color: 'var(--neutral-700)',
    marginBottom: 'var(--sp-1)',
    display: 'block',
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: 'var(--sp-2) var(--sp-3)',
    fontSize: 'var(--font-base)',
    border: '1px solid var(--neutral-300)',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    backgroundColor: 'var(--surface)',
    minHeight: '44px',
  }

  const selectStyle: CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  }

  const totalBarStyle: CSSProperties = {
    position: 'sticky',
    bottom: '64px',
    backgroundColor: 'var(--surface)',
    borderTop: '1px solid var(--border)',
    padding: 'var(--sp-3) var(--sp-4)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
    zIndex: 10,
    borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
  }

  const dropdownStyle: CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'var(--surface)',
    borderRadius: '0 0 var(--radius-md) var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid var(--border)',
    borderTop: 'none',
    maxHeight: '200px',
    overflow: 'auto',
    zIndex: 20,
  }

  const dropdownItemStyle: CSSProperties = {
    padding: 'var(--sp-3) var(--sp-4)',
    cursor: 'pointer',
    borderBottom: '1px solid var(--border)',
    fontSize: 'var(--font-sm)',
    transition: 'background-color var(--transition-fast)',
  }

  // ─── Success Screen ────────────────────────────────────
  if (showSuccess) {
    return (
      <div style={{ ...pageStyle, alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }} className="animate-scale-in">
        <div style={{
          width: '72px', height: '72px', borderRadius: '50%',
          backgroundColor: 'var(--success-100)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 'var(--sp-4)',
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--success-600)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--sp-2)' }}>
          Venda Confirmada!
        </h2>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 'var(--sp-6)' }}>
          Total: {formatBRL(total)}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)', width: '100%', maxWidth: '320px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => {}}>60mm</button>
          <button className="btn btn-secondary btn-sm" onClick={() => {}}>80mm</button>
          <button className="btn btn-secondary btn-sm" onClick={() => {}}>PDF</button>
          <button className="btn btn-secondary btn-sm" onClick={() => {}}>Compartilhar</button>
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-3)', marginTop: 'var(--sp-6)', width: '100%', maxWidth: '320px' }}>
          <button className="btn btn-primary btn-block" onClick={() => {
            setStep(0)
            setItems([])
            setPayments([])
            setDiscount(0)
            setSurcharge(0)
            setFreight(0)
            setCustomerId('')
            setShowSuccess(false)
          }}>
            Nova Venda
          </button>
          <button className="btn btn-secondary btn-block" onClick={() => navigate('/vendas')}>
            Voltar
          </button>
        </div>
      </div>
    )
  }

  // ─── Step 0: Itens ─────────────────────────────────────
  if (step === 0) {
    return (
      <div style={pageStyle}>
        <Stepper current={0} />

        {/* Cliente */}
        <div style={sectionStyle}>
          <span style={sectionTitleStyle}>Cliente</span>
          <div style={{ position: 'relative' }}>
            {selectedCustomer ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 500 }}>{selectedCustomer.name}</span>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 'var(--font-sm)' }}
                  onClick={() => { setCustomerId(''); setCustomerSearch('') }}
                >
                  Alterar
                </button>
              </div>
            ) : (
              <>
                <input
                  style={inputStyle}
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Buscar cliente ou Consumidor Final..."
                />
                {filteredCustomers.length > 0 && (
                  <div style={dropdownStyle}>
                    {filteredCustomers.map((c) => (
                      <div
                        key={c.id}
                        style={dropdownItemStyle}
                        onClick={() => {
                          setCustomerId(c.id)
                          setCustomerSearch('')
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>{c.name}</span>
                        {c.phone && <span style={{ marginLeft: 'var(--sp-2)', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>{c.phone}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
          {!customerId && (
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              Sem selecao = Consumidor Final
            </span>
          )}
        </div>

        {/* Adicionar item */}
        <div style={sectionStyle}>
          <span style={sectionTitleStyle}>Adicionar Item</span>
          <div style={{ position: 'relative' }}>
            <input
              style={inputStyle}
              value={productSearch}
              onChange={(e) => {
                setProductSearch(e.target.value)
                if (selectedProduct) setSelectedProduct(null)
              }}
              placeholder="Buscar produto..."
            />
            {filteredProducts.length > 0 && !selectedProduct && (
              <div style={dropdownStyle}>
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    style={dropdownItemStyle}
                    onClick={() => selectProduct(p)}
                  >
                    <span style={{ fontWeight: 500 }}>{p.name}</span>
                    {p.code && <span style={{ marginLeft: 'var(--sp-2)', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>{p.code}</span>}
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
                  <select
                    style={selectStyle}
                    value={selectedUnit}
                    onChange={(e) => {
                      setSelectedUnit(e.target.value)
                      const u = selectedProduct.units.find((u) => u.id === e.target.value)
                      if (u?.defaultPrice) setItemPrice(u.defaultPrice)
                    }}
                  >
                    {selectedProduct.units.map((u) => (
                      <option key={u.id} value={u.id}>{u.nameLabel}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Quantidade</label>
                  <input
                    type="number"
                    style={inputStyle}
                    value={itemQty}
                    onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    min={1}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Preco unitario</label>
                <input
                  type="text"
                  inputMode="decimal"
                  style={inputStyle}
                  value={itemPrice > 0 ? itemPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '')
                    setItemPrice(parseInt(raw || '0', 10) / 100)
                  }}
                  placeholder="R$ 0,00"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                  Subtotal: <strong style={{ color: 'var(--text-primary)' }}>{formatBRL(itemQty * itemPrice)}</strong>
                </span>
                <button className="btn btn-primary btn-sm" onClick={addItem}>
                  Adicionar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Lista de itens */}
        {items.length > 0 && (
          <div style={sectionStyle}>
            <span style={sectionTitleStyle}>Itens ({items.length})</span>
            {items.map((item) => (
              <div key={item.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--sp-2) 0', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500, display: 'block' }} className="text-truncate">
                    {item.productName}
                  </span>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    {item.qty} {item.unitLabel} x {formatBRL(item.unitPrice)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600 }}>
                    {formatBRL(item.qty * item.unitPrice)}
                  </span>
                  <button
                    type="button"
                    style={{
                      background: 'none', border: 'none', color: 'var(--danger-500)',
                      cursor: 'pointer', padding: 'var(--sp-1)',
                    }}
                    onClick={() => removeItem(item.id)}
                    aria-label="Remover item"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Desconto / Acrescimo / Frete */}
        {items.length > 0 && (
          <div style={sectionStyle}>
            <span style={sectionTitleStyle}>Ajustes</span>
            <div className="form-row">
              <div>
                <label style={labelStyle}>
                  Desconto ({discountType === 'percent' ? '%' : 'R$'})
                  <button
                    type="button"
                    style={{
                      marginLeft: 'var(--sp-2)', background: 'none', border: 'none',
                      color: 'var(--primary)', cursor: 'pointer', fontSize: 'var(--font-xs)',
                    }}
                    onClick={() => setDiscountType((prev) => prev === 'percent' ? 'fixed' : 'percent')}
                  >
                    Alternar
                  </button>
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  style={inputStyle}
                  value={discount > 0 ? discount.toString() : ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div>
                <label style={labelStyle}>Acrescimo (R$)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  style={inputStyle}
                  value={surcharge > 0 ? surcharge.toString() : ''}
                  onChange={(e) => setSurcharge(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Frete (R$)</label>
              <input
                type="text"
                inputMode="decimal"
                style={inputStyle}
                value={freight > 0 ? freight.toString() : ''}
                onChange={(e) => setFreight(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
          </div>
        )}

        {/* Total fixo + botao proximo */}
        {items.length > 0 && (
          <div style={totalBarStyle}>
            <div>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', display: 'block' }}>Total</span>
              <span style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                {formatBRL(total)}
              </span>
            </div>
            <button className="btn btn-primary btn-lg" onClick={() => setStep(1)}>
              Proximo
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─── Step 1: Pagamento ─────────────────────────────────
  if (step === 1) {
    const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
    const paymentValid = Math.abs(total - totalPaid) < 0.01

    return (
      <div style={pageStyle}>
        <Stepper current={1} />

        <div style={sectionStyle}>
          <span style={sectionTitleStyle}>Formas de Pagamento</span>
          <PaymentSplit
            total={total}
            payments={payments}
            onChange={handlePaymentsChange}
            accounts={accounts?.map((a) => ({ id: a.id, name: a.name }))}
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
          <button className="btn btn-secondary btn-block" onClick={() => setStep(0)}>
            Voltar
          </button>
          <button
            className="btn btn-primary btn-block"
            disabled={!paymentValid}
            onClick={() => setStep(2)}
          >
            Proximo
          </button>
        </div>
      </div>
    )
  }

  // ─── Step 2: Confirmacao ───────────────────────────────
  return (
    <div style={pageStyle}>
      <Stepper current={2} />

      {/* Resumo */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Resumo da Venda</span>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-2) 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>Cliente</span>
          <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>
            {selectedCustomer?.name ?? 'Consumidor Final'}
          </span>
        </div>

        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 'var(--sp-2)' }}>
          <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            Itens ({items.length})
          </span>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--sp-1) 0', fontSize: 'var(--font-sm)' }}>
              <span style={{ color: 'var(--text-primary)' }}>
                {item.qty} {item.unitLabel} - {item.productName}
              </span>
              <span style={{ fontWeight: 500 }}>{formatBRL(item.qty * item.unitPrice)}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
            <span>{formatBRL(subtotal)}</span>
          </div>
          {discountAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Desconto</span>
              <span style={{ color: 'var(--danger-600)' }}>-{formatBRL(discountAmount)}</span>
            </div>
          )}
          {surcharge > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Acrescimo</span>
              <span>+{formatBRL(surcharge)}</span>
            </div>
          )}
          {freight > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Frete</span>
              <span>+{formatBRL(freight)}</span>
            </div>
          )}
          <div className="divider" />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, fontSize: 'var(--font-lg)' }}>Total</span>
            <span style={{ fontWeight: 700, fontSize: 'var(--font-lg)', color: 'var(--primary)' }}>
              {formatBRL(total)}
            </span>
          </div>
        </div>
      </div>

      {/* Pagamento resumo */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Pagamento</span>
        {payments.map((p) => {
          const methodLabels: Record<string, string> = {
            CASH: 'Dinheiro', PIX: 'Pix', DEBIT_CARD: 'Cartao Debito',
            CREDIT_CARD: 'Cartao Credito', CREDIARIO: 'Crediario', BOLETO: 'Boleto', CHEQUE: 'Cheque',
          }
          return (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
              <span>{methodLabels[p.method] ?? p.method}</span>
              <span style={{ fontWeight: 500 }}>{formatBRL(p.amount)}</span>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
        <button className="btn btn-secondary btn-block" onClick={() => setStep(1)}>
          Voltar
        </button>
        <button
          className="btn btn-success btn-lg btn-block"
          onClick={handleConfirm}
          disabled={saving}
          style={{ fontWeight: 700 }}
        >
          {saving ? 'Confirmando...' : 'Confirmar Venda'}
        </button>
      </div>
    </div>
  )
}
