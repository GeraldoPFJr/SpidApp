'use client'

import { type CSSProperties, useCallback } from 'react'
import { formatCurrency } from '@/lib/format'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export interface PaymentEntry {
  id: string
  method: string
  amount: string
  accountId: string
  installments: number
  dueDays: number
  cardType?: string
}

interface PaymentSplitProps {
  payments: PaymentEntry[]
  onChange: (payments: PaymentEntry[]) => void
  total: number
  accounts: Array<{ id: string; name: string; defaultPaymentMethods?: string[] }>
}

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'PIX', label: 'PIX' },
  { value: 'CREDIT_CARD', label: 'Cartao Credito' },
  { value: 'DEBIT_CARD', label: 'Cartao Debito' },
  { value: 'CREDIARIO', label: 'Crediario' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'CHEQUE', label: 'Cheque' },
]

export function PaymentSplit({ payments, onChange, total, accounts }: PaymentSplitProps) {
  const { isMobile } = useMediaQuery()

  const findAccountForMethod = useCallback((method: string) => {
    const match = accounts.find((a) => a.defaultPaymentMethods?.includes(method))
    return match?.id ?? accounts[0]?.id ?? ''
  }, [accounts])

  const addPayment = useCallback(() => {
    const method = 'CASH'
    onChange([
      ...payments,
      {
        id: crypto.randomUUID(),
        method,
        amount: '',
        accountId: findAccountForMethod(method),
        installments: 1,
        dueDays: 30,
      },
    ])
  }, [payments, onChange, findAccountForMethod])

  const removePayment = useCallback((id: string) => {
    onChange(payments.filter((p) => p.id !== id))
  }, [payments, onChange])

  const updatePayment = useCallback((id: string, field: keyof PaymentEntry, value: string | number) => {
    onChange(payments.map((p) => {
      if (p.id !== id) return p
      const updated = { ...p, [field]: value }
      if (field === 'method') {
        updated.accountId = findAccountForMethod(value as string)
      }
      return updated
    }))
  }, [payments, onChange, findAccountForMethod])

  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount.replace(',', '.')) || 0), 0)
  const remaining = total - totalPaid
  const isBalanced = Math.abs(remaining) < 0.01

  /* ── Styles ── */

  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)',
    borderRadius: '16px',
    border: '1px solid rgba(0, 0, 0, 0.06)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isMobile ? '14px 16px' : '16px 20px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  }

  const addButtonStyle: CSSProperties = {
    padding: isMobile ? '8px 14px' : '6px 12px',
    fontSize: 'var(--font-xs)',
    fontWeight: 500,
    color: 'var(--color-primary-600)',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    minHeight: isMobile ? '44px' : 'auto',
    minWidth: isMobile ? '44px' : 'auto',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  }

  // Desktop: horizontal grid row (6 cols se >1 payment, 5 cols se 1 payment)
  const rowStyleDesktop: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: payments.length > 1
      ? '1fr 120px 1fr 80px 80px 40px'  // Forma, Valor, Conta, Parcelas, Prazo, Remove
      : '1fr 1fr 80px 80px 40px',        // Forma, Conta, Parcelas, Prazo, Remove (sem Valor)
    gap: '12px',
    padding: '12px 20px',
    alignItems: 'center',
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
  }

  // Mobile: vertical card per payment
  const rowStyleMobile: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    borderBottom: '1px solid rgba(0, 0, 0, 0.04)',
    position: 'relative',
  }

  const selectStyle: CSSProperties = {
    width: '100%',
    padding: isMobile ? '12px' : '8px 10px',
    fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-800)',
    backgroundColor: 'var(--color-neutral-50)',
    border: '1px solid transparent',
    borderRadius: '8px',
    outline: 'none',
    cursor: 'pointer',
    minHeight: isMobile ? '44px' : 'auto',
    WebkitAppearance: 'none' as CSSProperties['WebkitAppearance'],
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: isMobile ? '12px' : '8px 10px',
    fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-800)',
    backgroundColor: 'var(--color-neutral-50)',
    border: '1px solid transparent',
    borderRadius: '8px',
    outline: 'none',
    textAlign: 'right',
    minHeight: isMobile ? '44px' : 'auto',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  }

  const fieldLabelStyle: CSSProperties = {
    fontSize: 'var(--font-xs)',
    fontWeight: 500,
    color: 'var(--color-neutral-500)',
    marginBottom: '4px',
  }

  const removeButtonSize = isMobile ? 44 : 28

  const removeButtonStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: `${removeButtonSize}px`,
    height: `${removeButtonSize}px`,
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--color-neutral-300)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    flexShrink: 0,
  }

  /* ── Desktop column header labels ── */
  const headerLabelStyle: CSSProperties = {
    fontSize: 'var(--font-xs)',
    fontWeight: 500,
    color: 'var(--color-neutral-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  return (
    <div style={cardStyle}>
      {/* ── Header ── */}
      <div style={headerStyle}>
        <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: 0 }}>
          Formas de Pagamento
        </h3>
        <button onClick={addPayment} style={addButtonStyle}>
          + Adicionar
        </button>
      </div>

      {/* ── Empty State ── */}
      {payments.length === 0 ? (
        <div style={{
          padding: isMobile ? '40px 16px' : '32px 20px',
          textAlign: 'center',
          color: 'var(--color-neutral-400)',
          fontSize: 'var(--font-sm)',
        }}>
          Clique em &quot;Adicionar&quot; para incluir uma forma de pagamento
        </div>
      ) : (
        <div>
          {/* ── Column headers (desktop only) ── */}
          {!isMobile && (
            <div style={{
              ...rowStyleDesktop,
              backgroundColor: 'var(--color-neutral-50)',
              padding: '8px 20px',
              borderBottom: '1px solid var(--color-border)',
            }}>
              <span style={headerLabelStyle}>Forma</span>
              {payments.length > 1 && <span style={headerLabelStyle}>Valor (R$)</span>}
              <span style={headerLabelStyle}>Conta</span>
              <span style={headerLabelStyle}>Parcelas</span>
              <span style={headerLabelStyle}>Prazo</span>
              <span />
            </div>
          )}

          {/* ── Payment rows ── */}
          {payments.map((p) => {
            const needsInstallments = ['CREDIT_CARD', 'CREDIARIO', 'BOLETO', 'CHEQUE'].includes(p.method)

            if (isMobile) {
              return (
                <div key={p.id} style={rowStyleMobile}>
                  {/* Top row: method + account + remove button */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <div style={fieldLabelStyle}>Forma</div>
                      <select
                        value={p.method}
                        onChange={(e) => updatePayment(p.id, 'method', e.target.value)}
                        style={selectStyle}
                      >
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={fieldLabelStyle}>Conta</div>
                      <select
                        value={p.accountId}
                        onChange={(e) => updatePayment(p.id, 'accountId', e.target.value)}
                        style={selectStyle}
                      >
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => removePayment(p.id)}
                      style={removeButtonStyle}
                      aria-label="Remover pagamento"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>

                  {/* Amount — só mostra se tiver mais de 1 forma de pagamento */}
                  {payments.length > 1 && (
                    <div>
                      <div style={fieldLabelStyle}>Valor (R$)</div>
                      <input
                        type="text"
                        value={p.amount}
                        onChange={(e) => updatePayment(p.id, 'amount', e.target.value)}
                        placeholder="0,00"
                        style={inputStyle}
                      />
                    </div>
                  )}

                  {/* Installments + Due Days (only visible when applicable) */}
                  {needsInstallments && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={fieldLabelStyle}>Parcelas</div>
                        <input
                          type="number"
                          value={p.installments}
                          onChange={(e) => updatePayment(p.id, 'installments', parseInt(e.target.value, 10) || 1)}
                          min="1"
                          max="48"
                          style={{ ...inputStyle, textAlign: 'center' }}
                        />
                      </div>
                      {['CREDIARIO', 'BOLETO', 'CHEQUE'].includes(p.method) && (
                        <div style={{ flex: 1 }}>
                          <div style={fieldLabelStyle}>Prazo (dias)</div>
                          <input
                            type="number"
                            value={p.dueDays}
                            onChange={(e) => updatePayment(p.id, 'dueDays', parseInt(e.target.value, 10) || 1)}
                            min="1"
                            max="365"
                            placeholder="30"
                            style={{ ...inputStyle, textAlign: 'center' }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            }

            /* Desktop row */
            const needsDueDays = ['CREDIARIO', 'BOLETO', 'CHEQUE'].includes(p.method)
            return (
              <div key={p.id} style={rowStyleDesktop}>
                <select value={p.method} onChange={(e) => updatePayment(p.id, 'method', e.target.value)} style={selectStyle}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                {payments.length > 1 && (
                  <input
                    type="text"
                    value={p.amount}
                    onChange={(e) => updatePayment(p.id, 'amount', e.target.value)}
                    placeholder="0,00"
                    style={inputStyle}
                  />
                )}
                <select value={p.accountId} onChange={(e) => updatePayment(p.id, 'accountId', e.target.value)} style={selectStyle}>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <input
                  type="number"
                  value={needsInstallments ? p.installments : 1}
                  onChange={(e) => updatePayment(p.id, 'installments', parseInt(e.target.value, 10) || 1)}
                  min="1"
                  max="48"
                  disabled={!needsInstallments}
                  style={{ ...inputStyle, textAlign: 'center', opacity: needsInstallments ? 1 : 0.5 }}
                />
                <input
                  type="number"
                  value={needsDueDays ? p.dueDays : ''}
                  onChange={(e) => updatePayment(p.id, 'dueDays', parseInt(e.target.value, 10) || 1)}
                  min="1"
                  max="365"
                  placeholder="dias"
                  disabled={!needsDueDays}
                  style={{ ...inputStyle, textAlign: 'center', opacity: needsDueDays ? 1 : 0.5 }}
                />
                <button
                  onClick={() => removePayment(p.id)}
                  style={removeButtonStyle}
                  aria-label="Remover pagamento"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Footer: only show when values don't match ── */}
      {payments.length > 0 && !isBalanced && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '8px',
          padding: isMobile ? '10px 16px' : '10px 20px',
          backgroundColor: remaining > 0 ? 'var(--color-warning-50)' : 'var(--color-danger-50)',
          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: '0 0 16px 16px',
        }}>
          <span style={{
            fontWeight: 600,
            fontSize: 'var(--font-sm)',
            color: remaining > 0 ? 'var(--color-warning-700)' : 'var(--color-danger-700)',
          }}>
            {remaining > 0 ? `Restam ${formatCurrency(remaining)}` : `Excesso ${formatCurrency(Math.abs(remaining))}`}
          </span>
        </div>
      )}
    </div>
  )
}
