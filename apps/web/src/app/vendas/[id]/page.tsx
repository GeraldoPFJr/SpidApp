'use client'

import React, { type CSSProperties, useCallback, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { CouponPreview } from '@/components/CouponPreview'
import { useApi } from '@/hooks/useApi'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { apiClient } from '@/lib/api'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import type { Account } from '@spid/shared'

interface SaleRawItem {
  id: string
  productId: string
  unitId: string
  qty: number
  unitPrice: number
  total: number
  product?: { name: string; code?: string | null } | null
  unit?: { nameLabel: string } | null
  productName?: string
  unitLabel?: string
  code?: string
}

interface SaleRawPayment {
  id: string
  date: string
  method: string
  amount: number
  accountId: string
  installments: number | null
  account?: { name: string } | null
  accountName?: string
}

interface SaleRawReceivable {
  id: string
  dueDate: string
  amount: number
  status: string
  kind: string
}

interface SaleRaw {
  id: string
  customerId: string | null
  date: string
  status: string
  subtotal: number
  discount: number
  freight: number
  total: number
  couponNumber: number | null
  notes: string | null
  customer?: { name: string } | null
  customerName?: string | null
  items: SaleRawItem[]
  payments: SaleRawPayment[]
  receivables: SaleRawReceivable[]
}

interface SaleDetail {
  id: string
  customerId: string | null
  customerName: string | null
  date: string
  status: string
  subtotal: number
  discount: number
  freight: number
  total: number
  couponNumber: number | null
  notes: string | null
  items: Array<{
    id: string
    productName: string
    unitLabel: string
    code: string
    qty: number
    unitPrice: number
    total: number
  }>
  payments: Array<{
    id: string
    date: string
    method: string
    amount: number
    accountName: string
    installments: number | null
  }>
  receivables: Array<{
    id: string
    dueDate: string
    amount: number
    status: string
    kind: string
  }>
}

function mapSaleDetail(raw: SaleRaw): SaleDetail {
  return {
    id: raw.id,
    customerId: raw.customerId,
    customerName: raw.customerName ?? raw.customer?.name ?? null,
    date: raw.date,
    status: raw.status,
    subtotal: Number(raw.subtotal),
    discount: Number(raw.discount),
    freight: Number(raw.freight),
    total: Number(raw.total),
    couponNumber: raw.couponNumber,
    notes: raw.notes,
    items: raw.items.map((i) => ({
      id: i.id,
      productName: i.productName ?? i.product?.name ?? 'Produto',
      unitLabel: i.unitLabel ?? i.unit?.nameLabel ?? 'Unid.',
      code: i.code ?? i.product?.code ?? '',
      qty: Number(i.qty),
      unitPrice: Number(i.unitPrice),
      total: Number(i.total),
    })),
    payments: raw.payments.map((p) => ({
      id: p.id,
      date: p.date,
      method: p.method,
      amount: Number(p.amount),
      accountName: p.accountName ?? p.account?.name ?? '-',
      installments: p.installments,
    })),
    receivables: raw.receivables.map((r) => ({
      id: r.id,
      dueDate: r.dueDate,
      amount: Number(r.amount),
      status: r.status,
      kind: r.kind,
    })),
  }
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Dinheiro',
  PIX: 'PIX',
  CREDIT_CARD: 'Cartao Credito',
  DEBIT_CARD: 'Cartao Debito',
  CREDIARIO: 'Crediario',
  BOLETO: 'Boleto',
  CHEQUE: 'Cheque',
}

export default function VendaDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isMobile } = useMediaQuery()
  const { data: rawSale, loading, refetch } = useApi<SaleRaw>(`/sales/${id}`)
  const { data: accounts } = useApi<Account[]>('/accounts')
  const sale = rawSale ? mapSaleDetail(rawSale) : null
  const [showCoupon, setShowCoupon] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelMerchandise, setCancelMerchandise] = useState('')
  const [cancelMoney, setCancelMoney] = useState('')
  const [cancelNotes, setCancelNotes] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)

  // Receivable payment state
  const [payingId, setPayingId] = useState<string | null>(null)
  const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [payAmount, setPayAmount] = useState('')
  const [payMethod, setPayMethod] = useState('CASH')
  const [payAccountId, setPayAccountId] = useState('')
  const [paySaving, setPaySaving] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  const startPay = useCallback((receivableId: string, amount: number) => {
    setPayingId(receivableId)
    setPayDate(new Date().toISOString().slice(0, 10))
    setPayAmount(amount.toFixed(2).replace('.', ','))
    setPayMethod('CASH')
    setPayAccountId('')
    setPayError(null)
  }, [])

  const handlePay = useCallback(async (receivableId: string) => {
    if (!payAccountId) return
    const parsed = parseFloat(payAmount.replace(',', '.'))
    if (isNaN(parsed) || parsed <= 0) return

    setPaySaving(true)
    setPayError(null)
    try {
      await apiClient(`/receivables/${receivableId}/settle`, {
        method: 'POST',
        body: { amount: parsed, accountId: payAccountId, method: payMethod, date: payDate },
      })
      setPayingId(null)
      refetch()
    } catch {
      setPayError('Erro ao registrar recebimento.')
    } finally {
      setPaySaving(false)
    }
  }, [payAmount, payAccountId, payMethod, payDate, refetch])

  const kindLabels: Record<string, string> = {
    CREDIARIO: 'Crediario',
    BOLETO: 'Boleto',
    CHEQUE: 'Cheque',
    CARD_INSTALLMENT: 'Cartao',
  }

  const payMethodLabels: Record<string, string> = {
    CASH: 'Dinheiro',
    PIX: 'Pix',
    CREDIT_CARD: 'Cartao Credito',
    DEBIT_CARD: 'Cartao Debito',
  }

  const payFormInputStyle: CSSProperties = {
    padding: isMobile ? '10px 10px' : '6px 10px',
    fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-800)',
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-neutral-300)',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    minHeight: isMobile ? '44px' : 'auto',
  }

  const handleCancel = async () => {
    setCancelling(true)
    setCancelError(null)
    try {
      await apiClient(`/sales/${id}/cancel`, {
        method: 'POST',
        body: {
          merchandiseDestination: cancelMerchandise,
          moneyDestination: cancelMoney,
          notes: cancelNotes,
        },
      })
      setShowCancelModal(false)
      refetch()
    } catch {
      setCancelError('Erro ao cancelar venda. Tente novamente.')
    } finally {
      setCancelling(false)
    }
  }

  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: isMobile ? '16px' : '24px',
    boxShadow: 'var(--shadow-sm)',
  }

  const infoLabelStyle: CSSProperties = {
    fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)',
    textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px',
  }

  const infoValueStyle: CSSProperties = {
    fontSize: 'var(--font-base)', fontWeight: 500, color: 'var(--color-neutral-800)', margin: 0,
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="skeleton" style={{ height: '32px', width: isMobile ? '200px' : '300px' }} />
          <div className="skeleton skeleton-card" style={{ height: '200px' }} />
        </div>
      </Layout>
    )
  }

  if (!sale) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-neutral-500)' }}>Venda nao encontrada</div>
      </Layout>
    )
  }

  // Compute payment-aware status
  let computedPaymentStatus: string = sale.status
  if (sale.status === 'CONFIRMED') {
    const openRec = sale.receivables.filter((r) => r.status === 'OPEN')
    if (openRec.length === 0) {
      computedPaymentStatus = 'PAID'
    } else if (openRec.some((r) => new Date(r.dueDate) < new Date())) {
      computedPaymentStatus = 'OVERDUE'
    } else {
      computedPaymentStatus = 'OPEN'
    }
  }

  const statusMap: Record<string, { label: string; bg: string; color: string }> = {
    PAID: { label: 'Paga', bg: 'var(--color-success-100)', color: 'var(--color-success-700)' },
    OPEN: { label: 'Em Aberto', bg: 'var(--color-primary-100)', color: 'var(--color-primary-700)' },
    OVERDUE: { label: 'Vencida', bg: 'var(--color-danger-100)', color: 'var(--color-danger-700)' },
    DRAFT: { label: 'Rascunho', bg: 'var(--color-warning-100)', color: 'var(--color-warning-700)' },
    CANCELLED: { label: 'Cancelada', bg: 'var(--color-danger-100)', color: 'var(--color-danger-700)' },
  }
  const st = statusMap[computedPaymentStatus] ?? { label: 'Paga', bg: 'var(--color-success-100)', color: 'var(--color-success-700)' }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px', maxWidth: '1100px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => router.back()} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: isMobile ? '40px' : '36px', height: isMobile ? '40px' : '36px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)', cursor: 'pointer',
              flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: isMobile ? 'var(--font-xl)' : 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>
                  Venda #{String(sale.couponNumber ?? 0).padStart(4, '0')}
                </h1>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', fontSize: 'var(--font-xs)', fontWeight: 500, borderRadius: 'var(--radius-full)', backgroundColor: st.bg, color: st.color }}>
                  {st.label}
                </span>
              </div>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
                {formatDateTime(sale.date)} | {sale.customerName ?? 'Consumidor Final'}
              </p>
            </div>
          </div>
          {sale.status === 'CONFIRMED' && (
            <div style={{
              display: 'flex',
              gap: '8px',
              ...(isMobile && {
                width: '100%',
                flexDirection: 'column' as const,
              }),
            }}>
              <button onClick={() => setShowCoupon(!showCoupon)} style={{
                padding: isMobile ? '12px 16px' : '8px 16px',
                fontSize: 'var(--font-sm)',
                fontWeight: 500,
                color: 'var(--color-neutral-600)',
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-neutral-300)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                ...(isMobile && { width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center' }),
              }}>
                {showCoupon ? 'Esconder Cupom' : 'Ver Cupom'}
              </button>
              <button onClick={() => setShowCancelModal(true)} style={{
                padding: isMobile ? '12px 16px' : '8px 16px',
                fontSize: 'var(--font-sm)',
                fontWeight: 500,
                color: 'var(--color-danger-600)',
                backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-danger-200)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                ...(isMobile && { width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center' }),
              }}>
                Cancelar Venda
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div style={cardStyle}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: isMobile ? '16px' : '20px',
          }}>
            <div><p style={infoLabelStyle}>Cliente</p><p style={infoValueStyle}>{sale.customerName ?? 'Consumidor Final'}</p></div>
            <div><p style={infoLabelStyle}>Data</p><p style={infoValueStyle}>{formatDateTime(sale.date)}</p></div>
            <div><p style={infoLabelStyle}>Subtotal</p><p style={infoValueStyle}>{formatCurrency(sale.subtotal)}</p></div>
            {sale.discount > 0 && <div><p style={infoLabelStyle}>Desconto</p><p style={{ ...infoValueStyle, color: 'var(--color-success-600)' }}>- {formatCurrency(sale.discount)}</p></div>}
            {sale.freight > 0 && <div><p style={infoLabelStyle}>Frete</p><p style={infoValueStyle}>+ {formatCurrency(sale.freight)}</p></div>}
            <div><p style={infoLabelStyle}>Total</p><p style={{ ...infoValueStyle, fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(sale.total)}</p></div>
          </div>
        </div>

        {/* Items */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 16px' }}>Itens</h2>

          {isMobile ? (
            // ── Mobile: Card layout for items ──
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sale.items.map((item) => (
                <div key={item.id} style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-neutral-100)',
                  backgroundColor: 'var(--color-neutral-50)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <p style={{ fontWeight: 500, fontSize: 'var(--font-sm)', color: 'var(--color-neutral-800)', margin: 0 }}>
                        {item.productName}
                      </p>
                      {item.code && (
                        <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-neutral-400)', fontFamily: 'monospace', margin: '2px 0 0' }}>
                          {item.code}
                        </p>
                      )}
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--color-neutral-900)' }}>
                      {formatCurrency(item.total)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', fontSize: 'var(--font-xs)', color: 'var(--color-neutral-500)' }}>
                    <span>{item.unitLabel}</span>
                    <span>{item.qty} x {formatCurrency(item.unitPrice)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // ── Desktop: Table layout ──
            <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-sm)' }}>
                <thead>
                  <tr>
                    {['Codigo', 'Produto', 'Unidade', 'Qtd', 'Preco Unit.', 'Total'].map((h, i) => (
                      <th key={h} style={{
                        padding: '10px 16px',
                        textAlign: i >= 3 ? 'right' : 'left',
                        fontWeight: 500, color: 'var(--color-neutral-500)',
                        backgroundColor: 'var(--color-neutral-50)',
                        borderBottom: '1px solid var(--color-border)',
                        fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', fontFamily: 'monospace', fontSize: 'var(--font-xs)', color: 'var(--color-neutral-500)' }}>{item.code}</td>
                      <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', fontWeight: 500 }}>{item.productName}</td>
                      <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)' }}>{item.unitLabel}</td>
                      <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', textAlign: 'right' }}>{item.qty}</td>
                      <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', textAlign: 'right' }}>{formatCurrency(item.unitPrice)}</td>
                      <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payments */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 16px' }}>Pagamentos</h2>

          {isMobile ? (
            // ── Mobile: Card layout for payments ──
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {sale.payments.map((p) => {
                const methodLabel = METHOD_LABELS[p.method] ?? p.method
                return (
                  <div key={p.id} style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-neutral-100)',
                    backgroundColor: 'var(--color-neutral-50)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 500, fontSize: 'var(--font-sm)', color: 'var(--color-neutral-800)' }}>
                        {methodLabel}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--color-neutral-900)' }}>
                        {formatCurrency(p.amount)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: 'var(--font-xs)', color: 'var(--color-neutral-500)' }}>
                      <span>{formatDate(p.date)}</span>
                      <span>{p.accountName}</span>
                      {p.installments && <span>{p.installments}x</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            // ── Desktop: Table layout ──
            <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-sm)' }}>
                <thead>
                  <tr>
                    {['Data', 'Forma', 'Conta', 'Parcelas', 'Valor'].map((h, i) => (
                      <th key={h} style={{
                        padding: '10px 16px',
                        textAlign: i === 4 ? 'right' : 'left',
                        fontWeight: 500, color: 'var(--color-neutral-500)',
                        backgroundColor: 'var(--color-neutral-50)',
                        borderBottom: '1px solid var(--color-border)',
                        fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sale.payments.map((p) => {
                    const methodLabel = METHOD_LABELS[p.method] ?? p.method
                    return (
                      <tr key={p.id}>
                        <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)' }}>{formatDate(p.date)}</td>
                        <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)' }}>{methodLabel}</td>
                        <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)' }}>{p.accountName}</td>
                        <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)' }}>{p.installments ? `${p.installments}x` : '-'}</td>
                        <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(p.amount)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Receivables */}
        {sale.receivables.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: 0 }}>Recebiveis</h2>

            {isMobile ? (
              /* Mobile: cards */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {sale.receivables.map((rec) => {
                  const overdue = rec.status === 'OPEN' && new Date(rec.dueDate) < new Date()
                  const recStDefault = { label: 'Aberto', bg: 'var(--color-warning-100)', color: 'var(--color-warning-700)' }
                  const recStatusStyles: Record<string, { label: string; bg: string; color: string }> = {
                    OPEN: recStDefault,
                    PAID: { label: 'Pago', bg: 'var(--color-success-100)', color: 'var(--color-success-700)' },
                    CANCELLED: { label: 'Cancelado', bg: 'var(--color-neutral-100)', color: 'var(--color-neutral-500)' },
                  }
                  const recSt = recStatusStyles[rec.status] || recStDefault
                  return (
                    <React.Fragment key={rec.id}>
                      <div style={{
                        padding: '12px', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-neutral-200)',
                        backgroundColor: payingId === rec.id ? 'var(--color-success-50)' : 'var(--color-white)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ display: 'inline-flex', padding: '2px 8px', fontSize: 'var(--font-xs)', fontWeight: 500, borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)' }}>
                            {kindLabels[rec.kind] ?? rec.kind}
                          </span>
                          <span style={{ display: 'inline-flex', padding: '2px 10px', fontSize: 'var(--font-xs)', fontWeight: 500, borderRadius: 'var(--radius-full)', backgroundColor: recSt.bg, color: recSt.color }}>
                            {recSt.label}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: 'var(--font-xs)', color: overdue ? 'var(--color-danger-600)' : 'var(--color-neutral-500)', fontWeight: overdue ? 600 : 400 }}>
                            Venc: {formatDate(rec.dueDate)}
                          </span>
                          <span style={{ fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                            {formatCurrency(rec.amount)}
                          </span>
                        </div>

                        {payingId === rec.id ? (
                          <div style={{ borderTop: '1px solid var(--color-success-200)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {payError && (
                              <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-danger-50)', border: '1px solid var(--color-danger-100)', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger-700)', fontSize: 'var(--font-xs)' }}>
                                {payError}
                              </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div>
                                <label style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-600)', display: 'block', marginBottom: '4px' }}>Data</label>
                                <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} style={{ ...payFormInputStyle, width: '100%' }} />
                              </div>
                              <div>
                                <label style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-600)', display: 'block', marginBottom: '4px' }}>Valor</label>
                                <input type="text" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} style={{ ...payFormInputStyle, width: '100%', textAlign: 'right' }} />
                              </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                              <div>
                                <label style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-600)', display: 'block', marginBottom: '4px' }}>Metodo</label>
                                <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} style={{ ...payFormInputStyle, cursor: 'pointer', width: '100%' }}>
                                  {Object.entries(payMethodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-600)', display: 'block', marginBottom: '4px' }}>Conta</label>
                                <select value={payAccountId} onChange={(e) => setPayAccountId(e.target.value)} style={{ ...payFormInputStyle, cursor: 'pointer', width: '100%' }}>
                                  <option value="">Selecione...</option>
                                  {accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                                </select>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => setPayingId(null)} style={{
                                flex: 1, padding: '10px', fontSize: 'var(--font-xs)', fontWeight: 500,
                                color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)',
                                border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)',
                                cursor: 'pointer', minHeight: '44px',
                              }}>Cancelar</button>
                              <button onClick={() => handlePay(rec.id)} disabled={paySaving || !payAccountId} style={{
                                flex: 1, padding: '10px', fontSize: 'var(--font-xs)', fontWeight: 600,
                                color: 'var(--color-white)', backgroundColor: 'var(--color-success-600)',
                                border: 'none', borderRadius: 'var(--radius-md)',
                                cursor: (paySaving || !payAccountId) ? 'not-allowed' : 'pointer',
                                opacity: (paySaving || !payAccountId) ? 0.5 : 1,
                                minHeight: '44px',
                              }}>
                                {paySaving ? 'Salvando...' : 'Confirmar'}
                              </button>
                            </div>
                          </div>
                        ) : rec.status === 'OPEN' ? (
                          <button
                            onClick={() => startPay(rec.id, rec.amount)}
                            style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                              width: '100%', padding: '10px', fontSize: 'var(--font-xs)', fontWeight: 600,
                              color: 'var(--color-success-700)', backgroundColor: 'var(--color-success-50)',
                              border: '1px solid var(--color-success-200)', borderRadius: 'var(--radius-md)',
                              cursor: 'pointer', minHeight: '44px',
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            Receber
                          </button>
                        ) : null}
                      </div>
                    </React.Fragment>
                  )
                })}
              </div>
            ) : (
              /* Desktop: table */
              <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-sm)' }}>
                  <thead>
                    <tr>
                      {['Vencimento', 'Tipo', 'Valor', 'Status', ''].map((h, i) => (
                        <th key={h || 'action'} style={{
                          padding: '10px 16px',
                          textAlign: i === 2 ? 'right' : 'left',
                          fontWeight: 500, color: 'var(--color-neutral-500)',
                          backgroundColor: 'var(--color-neutral-50)',
                          borderBottom: '1px solid var(--color-border)',
                          fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em',
                          width: i === 4 ? '90px' : i === 3 ? '100px' : i === 2 ? '130px' : '120px',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sale.receivables.map((rec) => {
                      const overdue = rec.status === 'OPEN' && new Date(rec.dueDate) < new Date()
                      const rsDefault = { label: 'Aberto', bg: 'var(--color-warning-100)', color: 'var(--color-warning-700)' }
                      const recStatusMap: Record<string, { label: string; bg: string; color: string }> = {
                        OPEN: rsDefault,
                        PAID: { label: 'Pago', bg: 'var(--color-success-100)', color: 'var(--color-success-700)' },
                        CANCELLED: { label: 'Cancelado', bg: 'var(--color-neutral-100)', color: 'var(--color-neutral-500)' },
                      }
                      const rs = recStatusMap[rec.status] || rsDefault
                      return (
                        <React.Fragment key={rec.id}>
                          <tr>
                            <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', color: overdue ? 'var(--color-danger-600)' : undefined, fontWeight: overdue ? 600 : 400 }}>
                              {formatDate(rec.dueDate)}
                            </td>
                            <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)' }}>
                              {kindLabels[rec.kind] ?? rec.kind}
                            </td>
                            <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', textAlign: 'right', fontWeight: 600 }}>
                              {formatCurrency(rec.amount)}
                            </td>
                            <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', fontSize: 'var(--font-xs)', fontWeight: 500, borderRadius: 'var(--radius-full)', backgroundColor: rs.bg, color: rs.color }}>
                                {rs.label}
                              </span>
                            </td>
                            <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', textAlign: 'center' }}>
                              {rec.status === 'OPEN' && payingId !== rec.id && (
                                <button onClick={() => startPay(rec.id, rec.amount)} style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  padding: '4px 12px', fontSize: 'var(--font-xs)', fontWeight: 600,
                                  color: 'var(--color-success-700)', backgroundColor: 'var(--color-success-50)',
                                  border: '1px solid var(--color-success-200)', borderRadius: 'var(--radius-md)',
                                  cursor: 'pointer',
                                }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  Receber
                                </button>
                              )}
                              {payingId === rec.id && (
                                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-neutral-400)' }}>editando...</span>
                              )}
                            </td>
                          </tr>
                          {payingId === rec.id && (
                            <tr>
                              <td colSpan={5} style={{ padding: '12px 16px', backgroundColor: 'var(--color-success-50)', borderBottom: '1px solid var(--color-success-100)' }}>
                                {payError && (
                                  <div style={{ padding: '8px 12px', marginBottom: '8px', backgroundColor: 'var(--color-danger-50)', border: '1px solid var(--color-danger-100)', borderRadius: 'var(--radius-sm)', color: 'var(--color-danger-700)', fontSize: 'var(--font-xs)' }}>
                                    {payError}
                                  </div>
                                )}
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                                  <div>
                                    <label style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-600)', display: 'block', marginBottom: '4px' }}>Data</label>
                                    <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} style={{ ...payFormInputStyle, width: '140px' }} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-600)', display: 'block', marginBottom: '4px' }}>Valor</label>
                                    <input type="text" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} style={{ ...payFormInputStyle, width: '120px', textAlign: 'right' }} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-600)', display: 'block', marginBottom: '4px' }}>Metodo</label>
                                    <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} style={{ ...payFormInputStyle, cursor: 'pointer' }}>
                                      {Object.entries(payMethodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-600)', display: 'block', marginBottom: '4px' }}>Conta</label>
                                    <select value={payAccountId} onChange={(e) => setPayAccountId(e.target.value)} style={{ ...payFormInputStyle, cursor: 'pointer', minWidth: '160px' }}>
                                      <option value="">Selecione...</option>
                                      {accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                  </div>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    <button onClick={() => setPayingId(null)} style={{
                                      padding: '6px 14px', fontSize: 'var(--font-xs)', fontWeight: 500,
                                      color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)',
                                      border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                                    }}>Cancelar</button>
                                    <button onClick={() => handlePay(rec.id)} disabled={paySaving || !payAccountId} style={{
                                      padding: '6px 14px', fontSize: 'var(--font-xs)', fontWeight: 600,
                                      color: 'var(--color-white)', backgroundColor: 'var(--color-success-600)',
                                      border: 'none', borderRadius: 'var(--radius-md)',
                                      cursor: (paySaving || !payAccountId) ? 'not-allowed' : 'pointer',
                                      opacity: (paySaving || !payAccountId) ? 0.5 : 1,
                                    }}>
                                      {paySaving ? 'Salvando...' : 'Confirmar'}
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Coupon Preview */}
        {showCoupon && (
          <CouponPreview
            data={{
              companyName: 'Spid',
              customerName: sale.customerName ?? 'CONSUMIDOR FINAL',
              date: sale.date,
              couponNumber: sale.couponNumber ?? 0,
              items: sale.items.map((i) => ({
                code: i.code,
                description: `${i.productName} (${i.unitLabel})`,
                qty: i.qty,
                unitPrice: i.unitPrice,
                total: i.total,
              })),
              subtotal: sale.subtotal,
              discount: sale.discount,
              freight: sale.freight,
              total: sale.total,
              payments: sale.payments.map((p) => ({
                date: formatDate(p.date),
                amount: p.amount,
                method: { CASH: 'Dinheiro', PIX: 'PIX', CREDIT_CARD: 'Credito', DEBIT_CARD: 'Debito', CREDIARIO: 'Crediario', BOLETO: 'Boleto', CHEQUE: 'Cheque' }[p.method] ?? p.method,
              })),
            }}
          />
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? '0' : '16px',
          }} onClick={() => setShowCancelModal(false)}>
            <div style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: isMobile ? 'var(--radius-xl) var(--radius-xl) 0 0' : 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)',
              width: '100%',
              maxWidth: isMobile ? '100%' : '500px',
              padding: isMobile ? '20px 16px 32px' : '24px',
              maxHeight: isMobile ? '90vh' : undefined,
              overflowY: 'auto',
            }} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-900)', margin: '0 0 20px' }}>Cancelar Venda</h2>

              {cancelError && (
                <div style={{ padding: '10px 14px', marginBottom: '12px', backgroundColor: 'var(--color-danger-50)', border: '1px solid var(--color-danger-100)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-700)', fontSize: 'var(--font-sm)' }}>
                  {cancelError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <p style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-700)', margin: '0 0 8px' }}>O que foi feito com a mercadoria?</p>
                  {['Devolvida ao estoque', 'Credito para o cliente', 'Perda/estrago', 'Outro'].map((opt) => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: isMobile ? '8px 0' : '4px 0', fontSize: 'var(--font-sm)', color: 'var(--color-neutral-700)', cursor: 'pointer' }}>
                      <input type="radio" name="merchandise" value={opt} checked={cancelMerchandise === opt} onChange={(e) => setCancelMerchandise(e.target.value)} style={{ accentColor: 'var(--color-primary-600)', width: '18px', height: '18px' }} />
                      {opt}
                    </label>
                  ))}
                </div>

                <div>
                  <p style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-700)', margin: '0 0 8px' }}>O que foi feito com o dinheiro?</p>
                  {['Devolvido', 'Credito para o cliente', 'Estorno em cartao', 'Outro'].map((opt) => (
                    <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: isMobile ? '8px 0' : '4px 0', fontSize: 'var(--font-sm)', color: 'var(--color-neutral-700)', cursor: 'pointer' }}>
                      <input type="radio" name="money" value={opt} checked={cancelMoney === opt} onChange={(e) => setCancelMoney(e.target.value)} style={{ accentColor: 'var(--color-primary-600)', width: '18px', height: '18px' }} />
                      {opt}
                    </label>
                  ))}
                </div>

                <div>
                  <p style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-700)', margin: '0 0 4px' }}>Observacoes</p>
                  <textarea
                    value={cancelNotes}
                    onChange={(e) => setCancelNotes(e.target.value)}
                    placeholder="Motivo do cancelamento..."
                    style={{
                      width: '100%', padding: '8px 12px', fontSize: 'var(--font-sm)',
                      border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)',
                      outline: 'none', minHeight: '60px', resize: 'vertical',
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '20px',
                ...(isMobile && {
                  flexDirection: 'column-reverse' as const,
                }),
              }}>
                <button onClick={() => setShowCancelModal(false)} style={{
                  padding: isMobile ? '12px 16px' : '8px 16px',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 500,
                  color: 'var(--color-neutral-600)',
                  backgroundColor: 'var(--color-white)',
                  border: '1px solid var(--color-neutral-300)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  ...(isMobile && { width: '100%' }),
                }}>
                  Voltar
                </button>
                <button
                  onClick={handleCancel}
                  disabled={!cancelMerchandise || !cancelMoney || cancelling}
                  style={{
                    padding: isMobile ? '12px 16px' : '8px 16px',
                    fontSize: 'var(--font-sm)',
                    fontWeight: 600,
                    color: 'var(--color-white)',
                    backgroundColor: 'var(--color-danger-600)',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: (!cancelMerchandise || !cancelMoney || cancelling) ? 'not-allowed' : 'pointer',
                    opacity: (!cancelMerchandise || !cancelMoney || cancelling) ? 0.5 : 1,
                    ...(isMobile && { width: '100%' }),
                  }}
                >
                  {cancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
