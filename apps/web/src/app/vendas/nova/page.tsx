'use client'

import { type CSSProperties, useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { PaymentSplit, type PaymentEntry } from '@/components/PaymentSplit'
import { InstallmentConfig } from '@/components/InstallmentConfig'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import type { Customer, Product, ProductUnit, Account } from '@vendi/shared'

// ─── Types ──────────────────────────────────────────

interface ProductOption extends Product {
  units?: (ProductUnit & { price?: number })[]
}

interface SaleItem {
  id: string
  productId: string
  productName: string
  unitId: string
  unitLabel: string
  qty: string
  unitPrice: string
  subtotal: number
}

// ─── Component ──────────────────────────────────────

export default function NovaVendaPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1: Customer + Items
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [items, setItems] = useState<SaleItem[]>([])
  const [discount, setDiscount] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('fixed')
  const [surcharge, setSurcharge] = useState('')
  const [freight, setFreight] = useState('')

  // Step 2: Payment
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const [installmentConfig, setInstallmentConfig] = useState({
    installments: 1,
    intervalDays: 30,
    intervalMode: 'days' as 'days' | 'sameDay',
  })

  // Step 3: confirmation
  const [saving, setSaving] = useState(false)
  const [savedSaleId, setSavedSaleId] = useState<string | null>(null)

  // Data
  const { data: customers } = useApi<(Customer & { hasOverdue?: boolean })[]>('/customers')
  const { data: products } = useApi<ProductOption[]>('/products')
  const { data: accounts } = useApi<Account[]>('/accounts')

  // ─── Computed Values ──────────────────────────────

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.subtotal, 0), [items])

  const discountValue = useMemo(() => {
    const v = parseFloat(discount.replace(',', '.')) || 0
    return discountType === 'percent' ? subtotal * (v / 100) : v
  }, [discount, discountType, subtotal])

  const surchargeValue = parseFloat(surcharge.replace(',', '.')) || 0
  const freightValue = parseFloat(freight.replace(',', '.')) || 0
  const total = subtotal - discountValue + surchargeValue + freightValue

  const selectedCustomer = customers?.find((c) => c.id === customerId)

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers ?? []
    const term = customerSearch.toLowerCase()
    return (customers ?? []).filter((c) => c.name.toLowerCase().includes(term))
  }, [customers, customerSearch])

  // ─── Item Management ──────────────────────────────

  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productId: '',
        productName: '',
        unitId: '',
        unitLabel: '',
        qty: '1',
        unitPrice: '',
        subtotal: 0,
      },
    ])
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const updateItem = useCallback((id: string, field: keyof SaleItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        // Recalculate subtotal
        const qty = parseFloat(updated.qty.replace(',', '.')) || 0
        const price = parseFloat(updated.unitPrice.replace(',', '.')) || 0
        updated.subtotal = qty * price
        return updated
      }),
    )
  }, [])

  const selectProduct = useCallback((itemId: string, productId: string) => {
    const prod = products?.find((p) => p.id === productId)
    if (!prod) return
    const firstUnit = prod.units?.[0]
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item
        return {
          ...item,
          productId,
          productName: prod.name,
          unitId: firstUnit?.id ?? '',
          unitLabel: firstUnit?.nameLabel ?? '',
          unitPrice: firstUnit?.price?.toString() ?? '',
          subtotal: (parseFloat(item.qty) || 0) * (firstUnit?.price ?? 0),
        }
      }),
    )
  }, [products])

  // ─── Submit ───────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    setSaving(true)
    try {
      const result = await apiClient<{ id: string }>('/sales', {
        method: 'POST',
        body: {
          customerId: customerId,
          items: items.map((i) => ({
            productId: i.productId,
            unitId: i.unitId,
            qty: parseFloat(i.qty.replace(',', '.')) || 0,
            unitPrice: parseFloat(i.unitPrice.replace(',', '.')) || 0,
          })),
          discount: discountValue,
          surcharge: surchargeValue,
          freight: freightValue,
          payments: payments.map((p) => ({
            method: p.method,
            amount: parseFloat(p.amount.replace(',', '.')) || 0,
            accountId: p.accountId,
            installments: p.installments,
          })),
        },
      })
      setSavedSaleId(result.id)
      setStep(4) // Success
    } catch {
      alert('Erro ao salvar venda. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }, [customerId, items, discountValue, surchargeValue, freightValue, payments])

  // ─── Styles ───────────────────────────────────────

  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: '24px',
    boxShadow: 'var(--shadow-sm)',
  }

  const inputStyle: CSSProperties = {
    width: '100%', padding: '8px 12px', fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-800)', backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)',
    outline: 'none',
  }

  const selectStyle: CSSProperties = { ...inputStyle, cursor: 'pointer' }

  const labelStyle: CSSProperties = {
    fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)',
    marginBottom: '4px', display: 'block',
    textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  const stepperStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    marginBottom: '24px',
  }

  const stepItemStyle = (s: number): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    fontSize: 'var(--font-sm)',
    fontWeight: step >= s ? 600 : 400,
    color: step >= s ? 'var(--color-primary-600)' : 'var(--color-neutral-400)',
    position: 'relative',
  })

  const stepCircleStyle = (s: number): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    fontSize: 'var(--font-xs)',
    fontWeight: 600,
    backgroundColor: step > s ? 'var(--color-success-500)' : step === s ? 'var(--color-primary-600)' : 'var(--color-neutral-200)',
    color: step >= s ? 'var(--color-white)' : 'var(--color-neutral-500)',
    transition: 'all var(--transition-normal)',
  })

  const stepDividerStyle: CSSProperties = {
    width: '40px',
    height: '2px',
    backgroundColor: 'var(--color-neutral-200)',
  }

  const itemRowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 120px 80px 120px 100px 40px',
    gap: '8px',
    padding: '8px 0',
    alignItems: 'center',
    borderBottom: '1px solid var(--color-neutral-100)',
  }

  const miniInputStyle: CSSProperties = {
    padding: '6px 8px', fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-800)', backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-sm)',
    outline: 'none', width: '100%',
  }

  const summaryRowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '4px 0',
    fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-600)',
  }

  const totalRowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0 0',
    marginTop: '8px',
    borderTop: '2px solid var(--color-neutral-800)',
    fontSize: 'var(--font-lg)',
    fontWeight: 700,
    color: 'var(--color-neutral-900)',
  }

  const navButtonStyle = (variant: 'primary' | 'secondary'): CSSProperties => ({
    padding: '10px 24px',
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
    color: variant === 'primary' ? 'var(--color-white)' : 'var(--color-neutral-600)',
    backgroundColor: variant === 'primary' ? 'var(--color-primary-600)' : 'var(--color-white)',
    border: variant === 'primary' ? 'none' : '1px solid var(--color-neutral-300)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  })

  // ─── Render ───────────────────────────────────────

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.back()} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)', cursor: 'pointer',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>Nova Venda</h1>
        </div>

        {/* Stepper */}
        {step <= 3 && (
          <div style={stepperStyle}>
            <div style={stepItemStyle(1)}>
              <span style={stepCircleStyle(1)}>{step > 1 ? '\u2713' : '1'}</span>
              Cliente e Itens
            </div>
            <div style={stepDividerStyle} />
            <div style={stepItemStyle(2)}>
              <span style={stepCircleStyle(2)}>{step > 2 ? '\u2713' : '2'}</span>
              Pagamento
            </div>
            <div style={stepDividerStyle} />
            <div style={stepItemStyle(3)}>
              <span style={stepCircleStyle(3)}>3</span>
              Revisao
            </div>
          </div>
        )}

        {/* ─── STEP 1: Customer + Items ─── */}
        {step === 1 && (
          <>
            {/* Customer Selection */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 16px' }}>Cliente</h2>
              <div style={{ position: 'relative', maxWidth: '400px' }}>
                <input
                  type="text"
                  value={customerId ? selectedCustomer?.name ?? '' : customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value)
                    setCustomerId(null)
                    setShowCustomerDropdown(true)
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder="Buscar cliente ou deixar vazio para Consumidor Final..."
                  style={inputStyle}
                />
                {showCustomerDropdown && customerSearch && filteredCustomers.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                    backgroundColor: 'var(--color-white)', border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)',
                    maxHeight: '200px', overflowY: 'auto',
                  }}>
                    {filteredCustomers.slice(0, 10).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCustomerId(c.id)
                          setCustomerSearch('')
                          setShowCustomerDropdown(false)
                        }}
                        style={{
                          width: '100%', textAlign: 'left', padding: '8px 12px',
                          border: 'none', backgroundColor: 'transparent',
                          fontSize: 'var(--font-sm)', cursor: 'pointer',
                          borderBottom: '1px solid var(--color-neutral-100)',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-neutral-50)' }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                      >
                        <span>{c.name}</span>
                        {c.hasOverdue && (
                          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-danger-600)', fontWeight: 500 }}>Inadimplente</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedCustomer?.hasOverdue && (
                <div style={{
                  marginTop: '12px', padding: '10px 14px', backgroundColor: 'var(--color-warning-50)',
                  border: '1px solid var(--color-warning-100)', borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-sm)', color: 'var(--color-warning-700)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Este cliente possui parcelas em atraso
                </div>
              )}
            </div>

            {/* Items */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: 0 }}>Itens</h2>
                <button onClick={addItem} style={{
                  padding: '6px 14px', fontSize: 'var(--font-xs)', fontWeight: 500,
                  color: 'var(--color-primary-600)', backgroundColor: 'var(--color-primary-50)',
                  border: '1px solid var(--color-primary-200)', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                }}>
                  + Adicionar Item
                </button>
              </div>

              {items.length === 0 ? (
                <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-neutral-400)', fontSize: 'var(--font-sm)' }}>
                  Adicione itens a venda
                </div>
              ) : (
                <>
                  <div style={{ ...itemRowStyle, borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Produto</span>
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unidade</span>
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Qtd</span>
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Preco Unit.</span>
                    <span style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Subtotal</span>
                    <span />
                  </div>
                  {items.map((item) => {
                    const prod = products?.find((p) => p.id === item.productId)
                    return (
                      <div key={item.id} style={itemRowStyle}>
                        <select
                          value={item.productId}
                          onChange={(e) => selectProduct(item.id, e.target.value)}
                          style={miniInputStyle}
                        >
                          <option value="">Selecionar...</option>
                          {products?.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <select
                          value={item.unitId}
                          onChange={(e) => {
                            const unit = prod?.units?.find((u) => u.id === e.target.value)
                            updateItem(item.id, 'unitId', e.target.value)
                            if (unit) {
                              updateItem(item.id, 'unitLabel', unit.nameLabel)
                              if (unit.price) updateItem(item.id, 'unitPrice', String(unit.price))
                            }
                          }}
                          style={miniInputStyle}
                          disabled={!item.productId}
                        >
                          <option value="">Unid.</option>
                          {prod?.units?.map((u) => (
                            <option key={u.id} value={u.id}>{u.nameLabel}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={item.qty}
                          onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                          style={{ ...miniInputStyle, textAlign: 'center' }}
                        />
                        <input
                          type="text"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                          style={{ ...miniInputStyle, textAlign: 'right' }}
                        />
                        <span style={{ textAlign: 'right', fontWeight: 600, fontSize: 'var(--font-sm)' }}>
                          {formatCurrency(item.subtotal)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px', borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)',
                            cursor: 'pointer', color: 'var(--color-danger-500)',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </>
              )}

              {/* Totals */}
              {items.length > 0 && (
                <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={labelStyle}>Desconto</label>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <select
                          value={discountType}
                          onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
                          style={{ ...miniInputStyle, width: '60px', flexShrink: 0 }}
                        >
                          <option value="fixed">R$</option>
                          <option value="percent">%</option>
                        </select>
                        <input
                          type="text"
                          value={discount}
                          onChange={(e) => setDiscount(e.target.value)}
                          placeholder="0"
                          style={{ ...miniInputStyle, textAlign: 'right' }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Acrescimo (R$)</label>
                      <input type="text" value={surcharge} onChange={(e) => setSurcharge(e.target.value)} placeholder="0,00" style={{ ...miniInputStyle, textAlign: 'right' }} />
                    </div>
                    <div>
                      <label style={labelStyle}>Frete (R$)</label>
                      <input type="text" value={freight} onChange={(e) => setFreight(e.target.value)} placeholder="0,00" style={{ ...miniInputStyle, textAlign: 'right' }} />
                    </div>
                  </div>

                  <div style={{ maxWidth: '300px', marginLeft: 'auto' }}>
                    <div style={summaryRowStyle}>
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    {discountValue > 0 && (
                      <div style={{ ...summaryRowStyle, color: 'var(--color-success-600)' }}>
                        <span>Desconto</span>
                        <span>- {formatCurrency(discountValue)}</span>
                      </div>
                    )}
                    {surchargeValue > 0 && (
                      <div style={summaryRowStyle}>
                        <span>Acrescimo</span>
                        <span>+ {formatCurrency(surchargeValue)}</span>
                      </div>
                    )}
                    {freightValue > 0 && (
                      <div style={summaryRowStyle}>
                        <span>Frete</span>
                        <span>+ {formatCurrency(freightValue)}</span>
                      </div>
                    )}
                    <div style={totalRowStyle}>
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => router.back()} style={navButtonStyle('secondary')}>Cancelar</button>
              <button
                onClick={() => setStep(2)}
                disabled={items.length === 0}
                style={{ ...navButtonStyle('primary'), opacity: items.length === 0 ? 0.5 : 1, cursor: items.length === 0 ? 'not-allowed' : 'pointer' }}
              >
                Proximo: Pagamento
              </button>
            </div>
          </>
        )}

        {/* ─── STEP 2: Payment ─── */}
        {step === 2 && (
          <>
            <PaymentSplit
              payments={payments}
              onChange={setPayments}
              total={total}
              accounts={accounts?.map((a) => ({ id: a.id, name: a.name })) ?? []}
            />

            {/* Show InstallmentConfig if any payment needs installments */}
            {payments.some((p) => ['CREDIARIO', 'BOLETO', 'CHEQUE'].includes(p.method) && p.installments > 1) && (
              <InstallmentConfig
                totalAmount={
                  payments
                    .filter((p) => ['CREDIARIO', 'BOLETO', 'CHEQUE'].includes(p.method))
                    .reduce((sum, p) => sum + (parseFloat(p.amount.replace(',', '.')) || 0), 0)
                }
                installments={installmentConfig.installments}
                onInstallmentsChange={(v) => setInstallmentConfig((prev) => ({ ...prev, installments: v }))}
                intervalDays={installmentConfig.intervalDays}
                onIntervalChange={(v) => setInstallmentConfig((prev) => ({ ...prev, intervalDays: v }))}
                intervalMode={installmentConfig.intervalMode}
                onIntervalModeChange={(v) => setInstallmentConfig((prev) => ({ ...prev, intervalMode: v }))}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(1)} style={navButtonStyle('secondary')}>Voltar</button>
              <button
                onClick={() => setStep(3)}
                disabled={payments.length === 0}
                style={{ ...navButtonStyle('primary'), opacity: payments.length === 0 ? 0.5 : 1, cursor: payments.length === 0 ? 'not-allowed' : 'pointer' }}
              >
                Proximo: Revisao
              </button>
            </div>
          </>
        )}

        {/* ─── STEP 3: Review ─── */}
        {step === 3 && (
          <>
            <div style={cardStyle}>
              <h2 style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 16px' }}>Resumo da Venda</h2>

              {/* Customer */}
              <div style={{ marginBottom: '20px' }}>
                <p style={labelStyle}>Cliente</p>
                <p style={{ fontSize: 'var(--font-base)', fontWeight: 500, color: 'var(--color-neutral-800)', margin: 0 }}>
                  {selectedCustomer?.name ?? 'Consumidor Final'}
                </p>
              </div>

              {/* Items */}
              <p style={{ ...labelStyle, marginBottom: '8px' }}>Itens ({items.length})</p>
              <div style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-200)', overflow: 'hidden', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-sm)' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '8px 12px', textAlign: 'left', backgroundColor: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-neutral-200)', fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)' }}>Produto</th>
                      <th style={{ padding: '8px 12px', textAlign: 'center', backgroundColor: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-neutral-200)', fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)' }}>Qtd</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', backgroundColor: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-neutral-200)', fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)' }}>Unit.</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', backgroundColor: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-neutral-200)', fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-neutral-100)' }}>{item.productName} ({item.unitLabel})</td>
                        <td style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid var(--color-neutral-100)' }}>{item.qty}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid var(--color-neutral-100)' }}>{formatCurrency(parseFloat(item.unitPrice.replace(',', '.')) || 0)}</td>
                        <td style={{ padding: '8px 12px', textAlign: 'right', borderBottom: '1px solid var(--color-neutral-100)', fontWeight: 600 }}>{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div style={{ maxWidth: '300px', marginLeft: 'auto' }}>
                <div style={summaryRowStyle}><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                {discountValue > 0 && <div style={{ ...summaryRowStyle, color: 'var(--color-success-600)' }}><span>Desconto</span><span>- {formatCurrency(discountValue)}</span></div>}
                {surchargeValue > 0 && <div style={summaryRowStyle}><span>Acrescimo</span><span>+ {formatCurrency(surchargeValue)}</span></div>}
                {freightValue > 0 && <div style={summaryRowStyle}><span>Frete</span><span>+ {formatCurrency(freightValue)}</span></div>}
                <div style={totalRowStyle}><span>Total</span><span>{formatCurrency(total)}</span></div>
              </div>

              {/* Payments */}
              <div style={{ marginTop: '20px' }}>
                <p style={{ ...labelStyle, marginBottom: '8px' }}>Pagamento</p>
                {payments.map((p) => {
                  const methodLabel = { CASH: 'Dinheiro', PIX: 'PIX', CREDIT_CARD: 'Cartao Credito', DEBIT_CARD: 'Cartao Debito', CREDIARIO: 'Crediario', BOLETO: 'Boleto', CHEQUE: 'Cheque' }[p.method] ?? p.method
                  return (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 'var(--font-sm)' }}>
                      <span style={{ color: 'var(--color-neutral-600)' }}>
                        {methodLabel}
                        {p.installments > 1 && ` (${p.installments}x)`}
                      </span>
                      <span style={{ fontWeight: 500 }}>{formatCurrency(parseFloat(p.amount.replace(',', '.')) || 0)}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(2)} style={navButtonStyle('secondary')}>Voltar</button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                style={{
                  ...navButtonStyle('primary'),
                  backgroundColor: 'var(--color-success-600)',
                  padding: '12px 32px',
                  fontSize: 'var(--font-base)',
                  opacity: saving ? 0.7 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? 'Confirmando...' : 'Confirmar Venda'}
              </button>
            </div>
          </>
        )}

        {/* ─── STEP 4: Success ─── */}
        {step === 4 && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 24px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              backgroundColor: 'var(--color-success-100)', color: 'var(--color-success-600)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: '0 0 8px' }}>Venda Confirmada!</h2>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', margin: '0 0 32px' }}>
              A venda foi salva com sucesso. Total: {formatCurrency(total)}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {savedSaleId && (
                <button
                  onClick={() => router.push(`/vendas/${savedSaleId}`)}
                  style={navButtonStyle('secondary')}
                >
                  Ver Detalhes
                </button>
              )}
              {savedSaleId && (
                <button
                  onClick={() => router.push(`/vendas/${savedSaleId}?print=1`)}
                  style={navButtonStyle('secondary')}
                >
                  Imprimir Cupom
                </button>
              )}
              <button
                onClick={() => {
                  setStep(1)
                  setItems([])
                  setPayments([])
                  setCustomerId(null)
                  setDiscount('')
                  setSurcharge('')
                  setFreight('')
                  setSavedSaleId(null)
                }}
                style={navButtonStyle('primary')}
              >
                Nova Venda
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
