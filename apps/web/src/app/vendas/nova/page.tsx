'use client'

import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { PaymentSplit, type PaymentEntry } from '@/components/PaymentSplit'
import { InstallmentConfig } from '@/components/InstallmentConfig'
import { useApi } from '@/hooks/useApi'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useToast } from '@/hooks/useToast'
import { apiClient } from '@/lib/api'
import { formatCurrency } from '@/lib/format'
import { Toast } from '@xpid/ui'
import type { Customer, Product, ProductUnit, Account } from '@xpid/shared'

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

function createEmptyItem(): SaleItem {
  return {
    id: crypto.randomUUID(),
    productId: '',
    productName: '',
    unitId: '',
    unitLabel: '',
    qty: '1',
    unitPrice: '',
    subtotal: 0,
  }
}

// ─── Component ──────────────────────────────────────

export default function NovaVendaPage() {
  const router = useRouter()
  const { isMobile } = useMediaQuery()
  const { showToast, showError, toastProps } = useToast()

  // Customer
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false)
  const [creatingCustomer, setCreatingCustomer] = useState(false)

  // Items (always ends with a ghost row)
  const [items, setItems] = useState<SaleItem[]>([createEmptyItem()])

  // Adjustments
  const [discount, setDiscount] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('fixed')
  const [freight, setFreight] = useState('')

  // Payment
  const [payments, setPayments] = useState<PaymentEntry[]>([])
  const [installmentConfig, setInstallmentConfig] = useState({
    installments: 1,
    intervalDays: 30,
    intervalMode: 'days' as 'days' | 'sameDay',
  })

  // Submit
  const [saving, setSaving] = useState(false)
  const [savedSaleId, setSavedSaleId] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Refs for focus management
  const qtyRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const ghostProductRef = useRef<HTMLSelectElement | null>(null)

  // Data
  const { data: customers, refetch: refetchCustomers } =
    useApi<(Customer & { hasOverdue?: boolean })[]>('/customers')
  const { data: products } = useApi<ProductOption[]>('/products')
  const { data: accounts } = useApi<Account[]>('/accounts')

  // ─── Computed Values ──────────────────────────────

  const validItems = useMemo(() => items.filter((i) => i.productId), [items])

  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.subtotal, 0), [items])

  const discountValue = useMemo(() => {
    const v = parseFloat(discount.replace(',', '.')) || 0
    return discountType === 'percent' ? subtotal * (v / 100) : v
  }, [discount, discountType, subtotal])

  const freightValue = parseFloat(freight.replace(',', '.')) || 0
  const total = Math.max(0, subtotal - discountValue + freightValue)

  const selectedCustomer = customers?.find((c) => c.id === customerId)

  const filteredCustomers = useMemo(() => {
    const list = customers ?? []
    if (!customerSearch.trim()) return list.slice(0, 10)
    const term = customerSearch.toLowerCase()
    return list.filter((c) => c.name.toLowerCase().includes(term)).slice(0, 10)
  }, [customers, customerSearch])

  const hasExactMatch = useMemo(() => {
    if (!customerSearch.trim()) return true
    const term = customerSearch.trim().toLowerCase()
    return (customers ?? []).some((c) => c.name.toLowerCase() === term)
  }, [customers, customerSearch])

  // ─── Auto-fill Payment ────────────────────────────

  useEffect(() => {
    if (payments.length === 0 && accounts?.length && total > 0) {
      const cashAccount = accounts.find((a) => a.defaultPaymentMethods?.includes('CASH'))
      setPayments([
        {
          id: crypto.randomUUID(),
          method: 'CASH',
          amount: total.toFixed(2).replace('.', ','),
          accountId: cashAccount?.id ?? accounts[0]?.id ?? '',
          installments: 1,
          dueDays: 30,
        },
      ])
    }
  }, [accounts, payments.length, total])

  // Auto-update single payment amount when total changes
  useEffect(() => {
    if (payments.length === 1 && total > 0) {
      const first = payments[0]
      if (!first) return
      const newAmount = total.toFixed(2).replace('.', ',')
      if (first.amount !== newAmount) {
        setPayments((prev) => {
          const p = prev[0]
          if (!p) return prev
          return [{ ...p, amount: newAmount }]
        })
      }
    }
  }, [total, payments.length, payments])

  // ─── Customer Management ──────────────────────────

  const handleCreateInlineCustomer = useCallback(async () => {
    const name = customerSearch.trim()
    if (!name) return
    setCreatingCustomer(true)
    try {
      const newCustomer = await apiClient<Customer>('/customers', {
        method: 'POST',
        body: { name },
      })
      await refetchCustomers()
      setCustomerId(newCustomer.id)
      setCustomerSearch('')
      setShowCustomerDropdown(false)
      showToast('Cliente cadastrado')
    } catch (error) {
      showError(error, 'Erro ao cadastrar cliente')
    } finally {
      setCreatingCustomer(false)
    }
  }, [customerSearch, refetchCustomers, showToast, showError])

  // ─── Item Management ──────────────────────────────

  const ensureGhostRow = useCallback((currentItems: SaleItem[]) => {
    const lastItem = currentItems[currentItems.length - 1]
    if (!lastItem || lastItem.productId) {
      return [...currentItems, createEmptyItem()]
    }
    return currentItems
  }, [])

  const removeItem = useCallback(
    (id: string) => {
      setItems((prev) => {
        const filtered = prev.filter((i) => i.id !== id)
        return ensureGhostRow(filtered.length === 0 ? [] : filtered)
      })
    },
    [ensureGhostRow],
  )

  const updateItem = useCallback((id: string, field: keyof SaleItem, value: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: value }
        const qty = parseFloat(updated.qty.replace(',', '.')) || 0
        const price = parseFloat(updated.unitPrice.replace(',', '.')) || 0
        updated.subtotal = qty * price
        return updated
      }),
    )
  }, [])

  const selectProduct = useCallback(
    (itemId: string, productId: string) => {
      const prod = products?.find((p) => p.id === productId)
      if (!prod) return
      const firstUnit = prod.units?.[0]
      setItems((prev) => {
        const updated = prev.map((item) => {
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
        })
        return ensureGhostRow(updated)
      })
      // Focus qty field after product selection
      setTimeout(() => {
        qtyRefs.current[itemId]?.focus()
        qtyRefs.current[itemId]?.select()
      }, 50)
    },
    [products, ensureGhostRow],
  )

  // ─── Submit ───────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    setSaving(true)
    setSubmitError(null)
    try {
      const saleItems = items
        .filter((i) => i.productId)
        .map((i) => {
          const qty = parseFloat(i.qty.replace(',', '.')) || 0
          const unitPrice = parseFloat(i.unitPrice.replace(',', '.')) || 0
          return {
            productId: i.productId,
            unitId: i.unitId,
            qty,
            unitPrice,
            total: qty * unitPrice,
          }
        })
      if (saleItems.length === 0) return

      const result = await apiClient<{ id: string }>('/sales', {
        method: 'POST',
        body: {
          customerId: customerId,
          date: new Date().toISOString(),
          status: 'CONFIRMED',
          subtotal,
          discount: discountValue,
          freight: freightValue,
          total,
          deviceId: 'web',
          items: saleItems,
          payments: payments.map((p) => ({
            method: p.method,
            amount: parseFloat(p.amount.replace(',', '.')) || 0,
            accountId: p.accountId,
            installments: p.installments || null,
            installmentIntervalDays: ['CREDIARIO', 'BOLETO', 'CHEQUE'].includes(p.method)
              ? p.dueDays || 30
              : null,
          })),
        },
      })
      setSavedSaleId(result.id)
      setShowSuccess(true)
    } catch (error) {
      setSubmitError('Erro ao salvar venda. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }, [customerId, items, discountValue, freightValue, payments, subtotal, total])

  const resetForm = useCallback(() => {
    setItems([createEmptyItem()])
    setPayments([])
    setCustomerId(null)
    setCustomerSearch('')
    setDiscount('')
    setFreight('')
    setSavedSaleId(null)
    setShowSuccess(false)
    setSubmitError(null)
  }, [])

  // ─── Focus: Enter on qty goes to next ghost row ───

  const handleQtyKeyDown = useCallback((e: React.KeyboardEvent, _itemId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Find ghost row (last item without productId) and focus its product select
      setTimeout(() => {
        ghostProductRef.current?.focus()
      }, 50)
    }
  }, [])

  // ─── Styles ───────────────────────────────────────

  const sectionStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)',
    borderRadius: '16px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    padding: isMobile ? '16px' : '20px 24px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    animation: 'xpid-fade-in 0.3s ease',
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--color-neutral-400)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    margin: '0 0 12px',
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: isMobile ? '12px 14px' : '10px 12px',
    fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-800)',
    backgroundColor: 'var(--color-neutral-50)',
    border: '1px solid transparent',
    borderRadius: '10px',
    outline: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  }

  const miniInputStyle: CSSProperties = {
    padding: isMobile ? '10px 12px' : '8px 10px',
    fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-800)',
    backgroundColor: 'var(--color-neutral-50)',
    border: '1px solid transparent',
    borderRadius: '8px',
    outline: 'none',
    width: '100%',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  }

  const itemRowStyle: CSSProperties = isMobile
    ? {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px 0',
        position: 'relative',
      }
    : {
        display: 'grid',
        gridTemplateColumns: '1fr 120px 72px 100px 100px 36px',
        gap: '8px',
        padding: '6px 0',
        alignItems: 'center',
      }

  const headerLabelStyle: CSSProperties = {
    fontSize: '11px',
    fontWeight: 500,
    color: 'var(--color-neutral-400)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  }

  // ─── Render: Success ──────────────────────────────

  if (showSuccess) {
    return (
      <Layout>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: '20px',
            padding: isMobile ? '24px 16px' : '24px',
            animation: 'xpid-scale-in 0.3s ease',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-success-100)',
              color: 'var(--color-success-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h2
              style={{
                fontSize: 'var(--font-2xl)',
                fontWeight: 700,
                color: 'var(--color-neutral-900)',
                margin: '0 0 6px',
              }}
            >
              Venda Confirmada!
            </h2>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', margin: 0 }}>
              Total: {formatCurrency(total)}
            </p>
          </div>
          <div
            style={{
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: '8px',
              ...(isMobile && {
                flexDirection: 'column' as const,
                width: '100%',
                maxWidth: '320px',
              }),
            }}
          >
            {savedSaleId && (
              <button
                onClick={() => router.push(`/vendas/${savedSaleId}`)}
                style={{
                  padding: isMobile ? '12px 20px' : '10px 20px',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 500,
                  color: 'var(--color-neutral-600)',
                  backgroundColor: 'var(--color-white)',
                  border: '1px solid var(--color-neutral-300)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  ...(isMobile && { width: '100%' }),
                }}
              >
                Ver Detalhes
              </button>
            )}
            {savedSaleId && (
              <button
                onClick={() => router.push(`/vendas/${savedSaleId}?print=1`)}
                style={{
                  padding: isMobile ? '12px 20px' : '10px 20px',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 500,
                  color: 'var(--color-neutral-600)',
                  backgroundColor: 'var(--color-white)',
                  border: '1px solid var(--color-neutral-300)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  ...(isMobile && { width: '100%' }),
                }}
              >
                Imprimir Cupom
              </button>
            )}
            <button
              onClick={resetForm}
              style={{
                padding: isMobile ? '12px 24px' : '10px 24px',
                fontSize: 'var(--font-sm)',
                fontWeight: 600,
                color: 'var(--color-white)',
                backgroundColor: 'var(--color-primary-600)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                ...(isMobile && { width: '100%' }),
              }}
            >
              Nova Venda
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  // ─── Render: Main ─────────────────────────────────

  const canSubmit = validItems.length > 0 && !saving

  return (
    <>
      <Layout>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '12px' : '16px',
            maxWidth: '960px',
            paddingBottom: isMobile ? '100px' : '80px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => router.back()}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: isMobile ? '40px' : '34px',
                height: isMobile ? '40px' : '34px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-neutral-200)',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                color: 'var(--color-neutral-600)',
                flexShrink: 0,
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1
              style={{
                fontSize: isMobile ? 'var(--font-lg)' : 'var(--font-xl)',
                fontWeight: 700,
                color: 'var(--color-neutral-900)',
                margin: 0,
              }}
            >
              Nova Venda
            </h1>
          </div>

          {/* Error Banner */}
          {submitError && (
            <div
              style={{
                padding: '10px 16px',
                backgroundColor: 'var(--color-danger-50)',
                border: '1px solid var(--color-danger-200)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-danger-700)',
                fontSize: 'var(--font-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                animation: 'xpid-fade-in 0.2s ease',
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              {submitError}
              <button
                onClick={() => setSubmitError(null)}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-danger-500)',
                  padding: '2px',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* ─── SECTION: Cliente ─── */}
          <div style={sectionStyle}>
            <p style={sectionTitleStyle}>Cliente</p>
            <div
              style={{ position: 'relative' }}
              onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                  setShowCustomerDropdown(false)
                }
              }}
            >
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={customerId ? (selectedCustomer?.name ?? '') : customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value)
                    setCustomerId(null)
                    setShowCustomerDropdown(true)
                  }}
                  onFocus={() => setShowCustomerDropdown(true)}
                  placeholder={
                    isMobile
                      ? 'Buscar cliente...'
                      : 'Buscar cliente ou deixar vazio para Consumidor Final...'
                  }
                  style={inputStyle}
                />
                {customerId && (
                  <button
                    onClick={() => {
                      setCustomerId(null)
                      setCustomerSearch('')
                    }}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: 'var(--color-neutral-400)',
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: '44px',
                      minWidth: '44px',
                      justifyContent: 'center',
                    }}
                    tabIndex={-1}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
              {showCustomerDropdown && !customerId && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 20,
                    backgroundColor: 'var(--color-white)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    maxHeight: isMobile ? '200px' : '240px',
                    overflowY: 'auto',
                    marginTop: '4px',
                  }}
                >
                  {filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setCustomerId(c.id)
                        setCustomerSearch('')
                        setShowCustomerDropdown(false)
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: isMobile ? '12px 14px' : '9px 14px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        fontSize: 'var(--font-sm)',
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--color-neutral-50)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'background-color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLElement).style.backgroundColor =
                          'var(--color-neutral-50)'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                      }}
                    >
                      <span>{c.name}</span>
                      {c.hasOverdue && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'var(--color-danger-600)',
                            fontWeight: 500,
                            backgroundColor: 'var(--color-danger-50)',
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          Inadimplente
                        </span>
                      )}
                    </button>
                  ))}
                  {filteredCustomers.length === 0 && customerSearch.trim() && (
                    <div
                      style={{
                        padding: '12px',
                        textAlign: 'center',
                        color: 'var(--color-neutral-400)',
                        fontSize: 'var(--font-sm)',
                      }}
                    >
                      Nenhum cliente encontrado
                    </div>
                  )}
                  {customerSearch.trim() && !hasExactMatch && (
                    <button
                      onClick={handleCreateInlineCustomer}
                      disabled={creatingCustomer}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: isMobile ? '12px 14px' : '10px 14px',
                        border: 'none',
                        borderTop: '1px solid var(--color-neutral-200)',
                        backgroundColor: 'var(--color-primary-50)',
                        cursor: creatingCustomer ? 'wait' : 'pointer',
                        fontSize: 'var(--font-sm)',
                        color: 'var(--color-primary-700)',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'background-color var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLElement).style.backgroundColor =
                          'var(--color-primary-100)'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLElement).style.backgroundColor =
                          'var(--color-primary-50)'
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                      {creatingCustomer ? 'Criando...' : `Criar "${customerSearch.trim()}"`}
                    </button>
                  )}
                </div>
              )}
            </div>
            {selectedCustomer?.hasOverdue && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '8px 12px',
                  backgroundColor: 'var(--color-warning-50)',
                  border: '1px solid var(--color-warning-100)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--font-xs)',
                  color: 'var(--color-warning-700)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Este cliente possui parcelas em atraso
              </div>
            )}
          </div>

          {/* ─── SECTION: Itens ─── */}
          <div style={sectionStyle}>
            <p style={sectionTitleStyle}>Itens</p>

            {/* Column Headers — desktop only */}
            {!isMobile && (
              <div
                style={{
                  ...itemRowStyle,
                  borderBottom: '1px solid var(--color-neutral-100)',
                  paddingBottom: '8px',
                  marginBottom: '4px',
                }}
              >
                <span style={headerLabelStyle}>Produto</span>
                <span style={headerLabelStyle}>Unidade</span>
                <span style={{ ...headerLabelStyle, textAlign: 'center' }}>Qtd</span>
                <span style={{ ...headerLabelStyle, textAlign: 'right' }}>Preco</span>
                <span style={{ ...headerLabelStyle, textAlign: 'right' }}>Subtotal</span>
                <span />
              </div>
            )}

            {/* Item Rows */}
            {items.map((item, index) => {
              const isGhost = !item.productId
              const isLastItem = index === items.length - 1
              const prod = products?.find((p) => p.id === item.productId)

              if (isMobile) {
                // ── Mobile Card Layout ──
                return (
                  <div
                    key={item.id}
                    style={{
                      opacity: isGhost ? 0.55 : 1,
                      borderBottom: isLastItem ? 'none' : '1px solid var(--color-neutral-100)',
                      padding: '12px 0',
                      transition: 'opacity var(--transition-fast)',
                      position: 'relative',
                    }}
                  >
                    {/* Remove button — top right */}
                    {!isGhost && (
                      <button
                        onClick={() => removeItem(item.id)}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          right: '0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '32px',
                          height: '32px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--color-danger-50)',
                          border: '1px solid var(--color-danger-200)',
                          cursor: 'pointer',
                          color: 'var(--color-danger-500)',
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}

                    {/* Product select — full width */}
                    <div style={{ marginBottom: '8px', paddingRight: !isGhost ? '40px' : '0' }}>
                      <select
                        ref={isGhost ? ghostProductRef : undefined}
                        value={item.productId}
                        onChange={(e) => selectProduct(item.id, e.target.value)}
                        style={{ ...miniInputStyle, padding: '12px 10px' }}
                      >
                        <option value="">Selecionar produto...</option>
                        {products?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Unit + Qty + Price row */}
                    {!isGhost && (
                      <div
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}
                      >
                        <div>
                          <span
                            style={{ ...headerLabelStyle, display: 'block', marginBottom: '4px' }}
                          >
                            Unidade
                          </span>
                          <select
                            value={item.unitId}
                            onChange={(e) => {
                              const unit = prod?.units?.find((u) => u.id === e.target.value)
                              updateItem(item.id, 'unitId', e.target.value)
                              if (unit) {
                                updateItem(item.id, 'unitLabel', unit.nameLabel)
                                if (unit.price != null)
                                  updateItem(item.id, 'unitPrice', String(unit.price))
                              }
                            }}
                            style={{ ...miniInputStyle, padding: '10px 8px' }}
                            disabled={!item.productId}
                          >
                            <option value="" disabled hidden>
                              Selecione
                            </option>
                            {prod?.units?.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.nameLabel}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <span
                            style={{ ...headerLabelStyle, display: 'block', marginBottom: '4px' }}
                          >
                            Qtd
                          </span>
                          <input
                            ref={(el) => {
                              qtyRefs.current[item.id] = el
                            }}
                            type="text"
                            inputMode="decimal"
                            value={item.qty}
                            onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                            onKeyDown={(e) => handleQtyKeyDown(e, item.id)}
                            style={{ ...miniInputStyle, textAlign: 'center', padding: '10px 8px' }}
                          />
                        </div>
                        <div>
                          <span
                            style={{ ...headerLabelStyle, display: 'block', marginBottom: '4px' }}
                          >
                            Preco
                          </span>
                          <div style={{ position: 'relative' }}>
                            <span
                              style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: 'var(--font-sm)',
                                color: 'var(--color-neutral-500)',
                                pointerEvents: 'none',
                              }}
                            >
                              R$
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                              style={{
                                ...miniInputStyle,
                                textAlign: 'right',
                                padding: '10px 8px 10px 36px',
                              }}
                              placeholder="0,00"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Subtotal no mobile */}
                    {!isGhost && item.subtotal > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-end',
                          marginTop: '8px',
                          paddingTop: '4px',
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: 'var(--font-sm)',
                            color: 'var(--color-neutral-700)',
                          }}
                        >
                          Subtotal: {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    )}
                  </div>
                )
              }

              // ── Desktop Grid Layout ──
              return (
                <div
                  key={item.id}
                  style={{
                    ...itemRowStyle,
                    opacity: isGhost ? 0.55 : 1,
                    borderBottom: isLastItem ? 'none' : '1px solid var(--color-neutral-50)',
                    transition: 'opacity var(--transition-fast)',
                  }}
                >
                  <select
                    ref={isGhost ? ghostProductRef : undefined}
                    value={item.productId}
                    onChange={(e) => selectProduct(item.id, e.target.value)}
                    style={miniInputStyle}
                  >
                    <option value="">Selecionar...</option>
                    {products?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={item.unitId}
                    onChange={(e) => {
                      const unit = prod?.units?.find((u) => u.id === e.target.value)
                      updateItem(item.id, 'unitId', e.target.value)
                      if (unit) {
                        updateItem(item.id, 'unitLabel', unit.nameLabel)
                        if (unit.price != null) updateItem(item.id, 'unitPrice', String(unit.price))
                      }
                    }}
                    style={miniInputStyle}
                    disabled={!item.productId}
                  >
                    <option value="" disabled hidden>
                      Selecione
                    </option>
                    {prod?.units?.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nameLabel}
                      </option>
                    ))}
                  </select>
                  <input
                    ref={(el) => {
                      qtyRefs.current[item.id] = el
                    }}
                    type="text"
                    value={item.qty}
                    onChange={(e) => updateItem(item.id, 'qty', e.target.value)}
                    onKeyDown={(e) => handleQtyKeyDown(e, item.id)}
                    style={{ ...miniInputStyle, textAlign: 'center' }}
                    disabled={isGhost}
                  />
                  <div style={{ position: 'relative' }}>
                    <span
                      style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: 'var(--font-sm)',
                        color: 'var(--color-neutral-500)',
                        pointerEvents: 'none',
                      }}
                    >
                      R$
                    </span>
                    <input
                      type="text"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)}
                      style={{ ...miniInputStyle, textAlign: 'right', paddingLeft: '32px' }}
                      disabled={isGhost}
                      placeholder="0,00"
                    />
                  </div>
                  <span
                    style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      fontSize: 'var(--font-sm)',
                      color:
                        item.subtotal > 0 ? 'var(--color-neutral-800)' : 'var(--color-neutral-300)',
                      paddingRight: '4px',
                    }}
                  >
                    {item.subtotal > 0 ? formatCurrency(item.subtotal) : '-'}
                  </span>
                  {!isGhost ? (
                    <button
                      onClick={() => removeItem(item.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '28px',
                        height: '28px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'transparent',
                        border: '1px solid transparent',
                        cursor: 'pointer',
                        color: 'var(--color-neutral-300)',
                        transition: 'all var(--transition-fast)',
                      }}
                      onMouseEnter={(e) => {
                        ;(e.currentTarget as HTMLElement).style.color = 'var(--color-danger-500)'
                        ;(e.currentTarget as HTMLElement).style.borderColor =
                          'var(--color-danger-200)'
                        ;(e.currentTarget as HTMLElement).style.backgroundColor =
                          'var(--color-danger-50)'
                      }}
                      onMouseLeave={(e) => {
                        ;(e.currentTarget as HTMLElement).style.color = 'var(--color-neutral-300)'
                        ;(e.currentTarget as HTMLElement).style.borderColor = 'transparent'
                        ;(e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              )
            })}

            {/* Desconto / Frete — inline no card de itens */}
            {validItems.length > 0 && (
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--color-neutral-100)',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'flex-end',
                }}
              >
                {/* Selector R$/% — 20% da linha */}
                <div style={{ flex: '0 0 20%' }}>
                  <label style={{ ...headerLabelStyle, display: 'block', marginBottom: '4px' }}>
                    Tipo
                  </label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
                    style={{ ...miniInputStyle, width: '100%' }}
                  >
                    <option value="fixed">R$</option>
                    <option value="percent">%</option>
                  </select>
                </div>

                {/* Desconto — 40% da linha */}
                <div style={{ flex: '0 0 40%' }}>
                  <label style={{ ...headerLabelStyle, display: 'block', marginBottom: '4px' }}>
                    Desconto
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0"
                    style={{ ...miniInputStyle, textAlign: 'right' }}
                  />
                </div>

                {/* Frete — 40% da linha */}
                <div style={{ flex: '0 0 40%' }}>
                  <label style={{ ...headerLabelStyle, display: 'block', marginBottom: '4px' }}>
                    Frete
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={freight}
                    onChange={(e) => setFreight(e.target.value)}
                    placeholder="0,00"
                    style={{ ...miniInputStyle, textAlign: 'right' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ─── SECTION: Pagamento ─── */}
          <div style={{ animation: 'xpid-fade-in 0.3s ease 0.1s both' }}>
            <PaymentSplit
              payments={payments}
              onChange={setPayments}
              total={total}
              accounts={
                accounts?.map((a) => ({
                  id: a.id,
                  name: a.name,
                  defaultPaymentMethods: a.defaultPaymentMethods,
                })) ?? []
              }
            />

            {payments.some(
              (p) => ['CREDIARIO', 'BOLETO', 'CHEQUE'].includes(p.method) && p.installments > 1,
            ) && (
              <div style={{ marginTop: '12px' }}>
                <InstallmentConfig
                  totalAmount={payments
                    .filter((p) => ['CREDIARIO', 'BOLETO', 'CHEQUE'].includes(p.method))
                    .reduce((sum, p) => sum + (parseFloat(p.amount.replace(',', '.')) || 0), 0)}
                  installments={installmentConfig.installments}
                  onInstallmentsChange={(v) =>
                    setInstallmentConfig((prev) => ({ ...prev, installments: v }))
                  }
                  intervalDays={installmentConfig.intervalDays}
                  onIntervalChange={(v) =>
                    setInstallmentConfig((prev) => ({ ...prev, intervalDays: v }))
                  }
                  intervalMode={installmentConfig.intervalMode}
                  onIntervalModeChange={(v) =>
                    setInstallmentConfig((prev) => ({ ...prev, intervalMode: v }))
                  }
                />
              </div>
            )}
          </div>
        </div>
        <Toast {...toastProps} />
      </Layout>

      {/* ─── FIXED BOTTOM BAR — fonte unica do total ─── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          boxShadow: '0 -2px 16px rgba(0, 0, 0, 0.04)',
          padding: isMobile
            ? '12px 16px calc(env(safe-area-inset-bottom, 0px) + 12px)'
            : '12px 24px',
        }}
      >
        {isMobile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: 'var(--color-neutral-900)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {formatCurrency(total)}
              </span>
              {validItems.length > 0 && (
                <span
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    color: 'var(--color-neutral-400)',
                    marginTop: '2px',
                    fontWeight: 400,
                  }}
                >
                  {validItems.length} {validItems.length === 1 ? 'item' : 'itens'}
                  {discountValue > 0 && ` · desc ${formatCurrency(discountValue)}`}
                </span>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              style={{
                padding: '14px 28px',
                fontSize: 'var(--font-base)',
                fontWeight: 600,
                color: 'var(--color-white)',
                backgroundColor: canSubmit
                  ? 'var(--color-success-600)'
                  : 'var(--color-neutral-300)',
                border: 'none',
                borderRadius: '14px',
                cursor: canSubmit ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: canSubmit ? '0 4px 12px rgba(22, 163, 74, 0.25)' : 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {saving ? 'Confirmando...' : 'Confirmar'}
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              maxWidth: '960px',
              margin: '0 auto',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: 'var(--color-neutral-900)',
                  letterSpacing: '-0.02em',
                }}
              >
                {formatCurrency(total)}
              </span>
              {validItems.length > 0 && (
                <span
                  style={{
                    fontSize: 'var(--font-xs)',
                    color: 'var(--color-neutral-400)',
                    fontWeight: 400,
                  }}
                >
                  {validItems.length} {validItems.length === 1 ? 'item' : 'itens'}
                  {discountValue > 0 && ` · desc ${formatCurrency(discountValue)}`}
                  {freightValue > 0 && ` · frete ${formatCurrency(freightValue)}`}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => router.back()}
                style={{
                  padding: '10px 20px',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 500,
                  color: 'var(--color-neutral-500)',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--color-neutral-200)',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                  padding: '10px 32px',
                  fontSize: 'var(--font-base)',
                  fontWeight: 600,
                  color: 'var(--color-white)',
                  backgroundColor: canSubmit
                    ? 'var(--color-success-600)'
                    : 'var(--color-neutral-300)',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: canSubmit ? '0 4px 12px rgba(22, 163, 74, 0.25)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (canSubmit)
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      'var(--color-success-700)'
                }}
                onMouseLeave={(e) => {
                  if (canSubmit)
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      'var(--color-success-600)'
                }}
              >
                {saving ? 'Confirmando...' : 'Confirmar Venda'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
