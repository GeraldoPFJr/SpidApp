'use client'

import { type CSSProperties, useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/format'
import type { Account } from '@spid/shared'

// ─── Types ──────────────────────────────────────────────

interface OverdueCustomer {
  customerId: string
  customerName: string
  openAmount: number
  openCount: number
  maxDaysOverdue: number
  lastPurchase: string | null
  receivables: Array<{
    id: string
    saleId: string | null
    dueDate: string
    amount: number
    kind: string
    daysOverdue: number
    couponNumber: number | null
  }>
}

// ─── Component ──────────────────────────────────────────

export default function InadimplentesPage() {
  const router = useRouter()
  const { data, loading, refetch } = useApi<OverdueCustomer[]>('/receivables/overdue')
  const { data: accounts } = useApi<Account[]>('/accounts')

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [payingId, setPayingId] = useState<string | null>(null)
  const [payAmount, setPayAmount] = useState('')
  const [payAccountId, setPayAccountId] = useState('')
  const [payMethod, setPayMethod] = useState('CASH')
  const [saving, setSaving] = useState(false)

  const toggleExpand = useCallback((customerId: string) => {
    setExpandedId((prev) => (prev === customerId ? null : customerId))
    setPayingId(null)
  }, [])

  const startPay = useCallback((receivableId: string, amount: number) => {
    setPayingId(receivableId)
    setPayAmount(amount.toFixed(2).replace('.', ','))
    setPayAccountId('')
    setPayMethod('CASH')
  }, [])

  const handlePay = useCallback(async (receivableId: string) => {
    if (!payAccountId) return
    const parsed = parseFloat(payAmount.replace(',', '.'))
    if (isNaN(parsed) || parsed <= 0) return

    setSaving(true)
    try {
      await apiClient(`/receivables/${receivableId}/settle`, {
        method: 'POST',
        body: { amount: parsed, accountId: payAccountId, method: payMethod },
      })
      setPayingId(null)
      refetch()
    } catch {
      alert('Erro ao registrar recebimento')
    } finally {
      setSaving(false)
    }
  }, [payAmount, payAccountId, payMethod, refetch])

  const totalOpen = useMemo(() => (data ?? []).reduce((sum, c) => sum + c.openAmount, 0), [data])
  const totalCustomers = data?.length ?? 0

  const kindLabels: Record<string, string> = {
    CREDIARIO: 'Crediario',
    BOLETO: 'Boleto',
    CHEQUE: 'Cheque',
    CARD_INSTALLMENT: 'Cartao',
  }

  const methodLabels: Record<string, string> = {
    CASH: 'Dinheiro',
    PIX: 'Pix',
    CREDIT_CARD: 'Cartao Credito',
    DEBIT_CARD: 'Cartao Debito',
  }

  const columns: DataTableColumn<OverdueCustomer>[] = useMemo(() => [
    {
      key: 'customerName',
      header: 'Cliente',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--color-danger-100)', color: 'var(--color-danger-600)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--font-xs)', fontWeight: 700, flexShrink: 0,
          }}>
            {row.customerName.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontWeight: 500 }}>{row.customerName}</span>
        </div>
      ),
    },
    {
      key: 'openAmount',
      header: 'Valor em Aberto',
      align: 'right',
      width: '160px',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--color-danger-600)' }}>
          {formatCurrency(row.openAmount)}
        </span>
      ),
    },
    {
      key: 'openCount',
      header: 'Qtd Notas',
      align: 'center',
      width: '110px',
      render: (row) => (
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: '28px', height: '24px', padding: '0 8px',
          fontSize: 'var(--font-xs)', fontWeight: 600,
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-danger-100)', color: 'var(--color-danger-700)',
        }}>
          {row.openCount}
        </span>
      ),
    },
    {
      key: 'maxDaysOverdue',
      header: 'Dias Atraso',
      align: 'right',
      width: '120px',
      render: (row) => {
        const severity = row.maxDaysOverdue > 30 ? 'var(--color-danger-600)' : row.maxDaysOverdue > 7 ? 'var(--color-warning-600)' : 'var(--color-neutral-600)'
        return <span style={{ fontWeight: 600, color: severity }}>{row.maxDaysOverdue}d</span>
      },
    },
    {
      key: 'lastPurchase',
      header: 'Ultima Compra',
      width: '130px',
      render: (row) => (
        <span style={{ color: 'var(--color-neutral-500)' }}>
          {row.lastPurchase ? formatDate(row.lastPurchase) : '-'}
        </span>
      ),
    },
  ], [])

  // ─── Styles ────────────────────────────────────────

  const summaryGridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  }

  const summaryCardStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: '20px',
    boxShadow: 'var(--shadow-sm)',
  }

  const summaryLabelStyle: CSSProperties = {
    fontSize: 'var(--font-xs)',
    fontWeight: 500,
    color: 'var(--color-neutral-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 4px',
  }

  const summaryValueStyle: CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--color-neutral-900)',
    margin: 0,
  }

  const receivableTableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 'var(--font-sm)',
  }

  const recThStyle: CSSProperties = {
    padding: '8px 16px',
    fontWeight: 500,
    color: 'var(--color-neutral-500)',
    fontSize: 'var(--font-xs)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'left',
    borderBottom: '1px solid var(--color-neutral-200)',
  }

  const recTdStyle: CSSProperties = {
    padding: '10px 16px',
    color: 'var(--color-neutral-700)',
    borderBottom: '1px solid var(--color-neutral-100)',
  }

  const payBtnStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 12px',
    fontSize: 'var(--font-xs)',
    fontWeight: 600,
    color: 'var(--color-success-700)',
    backgroundColor: 'var(--color-success-50)',
    border: '1px solid var(--color-success-200)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  }

  const payFormInputStyle: CSSProperties = {
    padding: '6px 10px',
    fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-800)',
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-neutral-300)',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
  }

  // ─── Render ────────────────────────────────────────

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>
            Inadimplentes
          </h1>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', margin: '4px 0 0' }}>
            Clientes com parcelas vencidas
          </p>
        </div>

        {/* Summary cards */}
        {!loading && data && (
          <div style={summaryGridStyle}>
            <div style={summaryCardStyle}>
              <p style={summaryLabelStyle}>Total em Aberto</p>
              <p style={{ ...summaryValueStyle, color: 'var(--color-danger-600)' }}>
                {formatCurrency(totalOpen)}
              </p>
            </div>
            <div style={summaryCardStyle}>
              <p style={summaryLabelStyle}>Clientes Inadimplentes</p>
              <p style={summaryValueStyle}>{totalCustomers}</p>
            </div>
            <div style={summaryCardStyle}>
              <p style={summaryLabelStyle}>Media por Cliente</p>
              <p style={summaryValueStyle}>
                {totalCustomers > 0 ? formatCurrency(totalOpen / totalCustomers) : 'R$ 0,00'}
              </p>
            </div>
          </div>
        )}

        {/* Overdue customers table */}
        <DataTable
          columns={columns}
          rows={data ?? []}
          keyExtractor={(row) => row.customerId}
          onRowClick={(row) => toggleExpand(row.customerId)}
          loading={loading}
          searchPlaceholder="Buscar cliente..."
          searchKeys={['customerName']}
          emptyTitle="Nenhum cliente inadimplente"
          emptyDescription="Todos os clientes estao em dia com seus pagamentos"
          emptyIcon={
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-success-400)' }}>
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          }
        />

        {/* Expanded detail rows */}
        {expandedId && data?.find((c) => c.customerId === expandedId) && (() => {
          const customer = data.find((c) => c.customerId === expandedId)!
          return (
            <div style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
              animation: 'fadeIn 200ms ease-out',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderBottom: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-neutral-50)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--color-danger-100)', color: 'var(--color-danger-600)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 'var(--font-sm)', fontWeight: 700,
                  }}>
                    {customer.customerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: 'var(--color-neutral-900)', margin: 0, fontSize: 'var(--font-base)' }}>
                      {customer.customerName}
                    </p>
                    <p style={{ color: 'var(--color-neutral-500)', margin: 0, fontSize: 'var(--font-xs)' }}>
                      {customer.openCount} parcela{customer.openCount > 1 ? 's' : ''} em aberto
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => router.push(`/clientes/${customer.customerId}`)}
                    style={{
                      padding: '6px 14px', fontSize: 'var(--font-xs)', fontWeight: 500,
                      color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)',
                      border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)',
                      cursor: 'pointer', transition: 'all var(--transition-fast)',
                    }}
                  >
                    Ver Cliente
                  </button>
                  <button
                    onClick={() => setExpandedId(null)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '32px', height: '32px',
                      borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-white)',
                      border: '1px solid var(--color-neutral-300)', cursor: 'pointer',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={receivableTableStyle}>
                  <thead>
                    <tr>
                      <th style={recThStyle}>Vencimento</th>
                      <th style={recThStyle}>Tipo</th>
                      <th style={recThStyle}>Cupom</th>
                      <th style={{ ...recThStyle, textAlign: 'right' }}>Valor</th>
                      <th style={{ ...recThStyle, textAlign: 'right' }}>Dias Atraso</th>
                      <th style={{ ...recThStyle, textAlign: 'center' }}>Acao</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.receivables.map((rec) => (
                      <>
                        <tr key={rec.id}>
                          <td style={recTdStyle}>{formatDate(rec.dueDate)}</td>
                          <td style={recTdStyle}>
                            <span style={{
                              display: 'inline-flex', padding: '2px 8px',
                              fontSize: 'var(--font-xs)', fontWeight: 500,
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)',
                            }}>
                              {kindLabels[rec.kind] ?? rec.kind}
                            </span>
                          </td>
                          <td style={recTdStyle}>
                            {rec.couponNumber ? `#${String(rec.couponNumber).padStart(4, '0')}` : '-'}
                          </td>
                          <td style={{ ...recTdStyle, textAlign: 'right', fontWeight: 600 }}>
                            {formatCurrency(rec.amount)}
                          </td>
                          <td style={{ ...recTdStyle, textAlign: 'right' }}>
                            <span style={{
                              fontWeight: 600,
                              color: rec.daysOverdue > 30 ? 'var(--color-danger-600)' : rec.daysOverdue > 7 ? 'var(--color-warning-600)' : 'var(--color-neutral-600)',
                            }}>
                              {rec.daysOverdue}d
                            </span>
                          </td>
                          <td style={{ ...recTdStyle, textAlign: 'center' }}>
                            {payingId === rec.id ? (
                              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-neutral-400)' }}>editando...</span>
                            ) : (
                              <button
                                onClick={(e) => { e.stopPropagation(); startPay(rec.id, rec.amount) }}
                                style={payBtnStyle}
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Receber
                              </button>
                            )}
                          </td>
                        </tr>
                        {payingId === rec.id && (
                          <tr key={`${rec.id}-pay`}>
                            <td colSpan={6} style={{ padding: '12px 16px', backgroundColor: 'var(--color-success-50)', borderBottom: '1px solid var(--color-success-100)' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                                <div>
                                  <label style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-600)', display: 'block', marginBottom: '4px' }}>Valor</label>
                                  <input
                                    type="text"
                                    value={payAmount}
                                    onChange={(e) => setPayAmount(e.target.value)}
                                    style={{ ...payFormInputStyle, width: '120px', textAlign: 'right' }}
                                  />
                                </div>
                                <div>
                                  <label style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-600)', display: 'block', marginBottom: '4px' }}>Metodo</label>
                                  <select
                                    value={payMethod}
                                    onChange={(e) => setPayMethod(e.target.value)}
                                    style={{ ...payFormInputStyle, cursor: 'pointer' }}
                                  >
                                    {Object.entries(methodLabels).map(([k, v]) => (
                                      <option key={k} value={k}>{v}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-600)', display: 'block', marginBottom: '4px' }}>Conta</label>
                                  <select
                                    value={payAccountId}
                                    onChange={(e) => setPayAccountId(e.target.value)}
                                    style={{ ...payFormInputStyle, cursor: 'pointer', minWidth: '160px' }}
                                  >
                                    <option value="">Selecione...</option>
                                    {accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                                  </select>
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => setPayingId(null)}
                                    style={{
                                      padding: '6px 14px', fontSize: 'var(--font-xs)', fontWeight: 500,
                                      color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)',
                                      border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)',
                                      cursor: 'pointer',
                                    }}
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => handlePay(rec.id)}
                                    disabled={saving || !payAccountId}
                                    style={{
                                      padding: '6px 14px', fontSize: 'var(--font-xs)', fontWeight: 600,
                                      color: 'var(--color-white)', backgroundColor: 'var(--color-success-600)',
                                      border: 'none', borderRadius: 'var(--radius-md)',
                                      cursor: (saving || !payAccountId) ? 'not-allowed' : 'pointer',
                                      opacity: (saving || !payAccountId) ? 0.5 : 1,
                                    }}
                                  >
                                    {saving ? 'Salvando...' : 'Confirmar'}
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}
      </div>
    </Layout>
  )
}
