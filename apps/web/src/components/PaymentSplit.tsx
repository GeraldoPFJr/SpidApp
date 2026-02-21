'use client'

import { type CSSProperties, useCallback } from 'react'
import { formatCurrency } from '@/lib/format'

export interface PaymentEntry {
  id: string
  method: string
  amount: string
  accountId: string
  installments: number
  cardType?: string
}

interface PaymentSplitProps {
  payments: PaymentEntry[]
  onChange: (payments: PaymentEntry[]) => void
  total: number
  accounts: Array<{ id: string; name: string }>
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
  const addPayment = useCallback(() => {
    onChange([
      ...payments,
      {
        id: crypto.randomUUID(),
        method: 'CASH',
        amount: '',
        accountId: accounts[0]?.id ?? '',
        installments: 1,
      },
    ])
  }, [payments, onChange, accounts])

  const removePayment = useCallback((id: string) => {
    onChange(payments.filter((p) => p.id !== id))
  }, [payments, onChange])

  const updatePayment = useCallback((id: string, field: keyof PaymentEntry, value: string | number) => {
    onChange(payments.map((p) => (p.id === id ? { ...p, [field]: value } : p)))
  }, [payments, onChange])

  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(p.amount.replace(',', '.')) || 0), 0)
  const remaining = total - totalPaid
  const isBalanced = Math.abs(remaining) < 0.01

  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid var(--color-border)',
  }

  const rowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 140px 1fr 100px 40px',
    gap: '12px',
    padding: '12px 20px',
    alignItems: 'center',
    borderBottom: '1px solid var(--color-neutral-100)',
  }

  const selectStyle: CSSProperties = {
    width: '100%', padding: '6px 10px', fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-800)', backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-sm)',
    outline: 'none', cursor: 'pointer',
  }

  const inputStyle: CSSProperties = {
    width: '100%', padding: '6px 10px', fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-800)', backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-sm)',
    outline: 'none', textAlign: 'right',
  }

  const footerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    backgroundColor: isBalanced ? 'var(--color-success-50)' : 'var(--color-warning-50)',
    borderTop: '1px solid var(--color-border)',
    borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
  }

  return (
    <div style={cardStyle}>
      <div style={headerStyle}>
        <h3 style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: 0 }}>
          Formas de Pagamento
        </h3>
        <button
          onClick={addPayment}
          style={{
            padding: '4px 12px', fontSize: 'var(--font-xs)', fontWeight: 500,
            color: 'var(--color-primary-600)', backgroundColor: 'var(--color-primary-50)',
            border: '1px solid var(--color-primary-200)', borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
          }}
        >
          + Adicionar
        </button>
      </div>

      {payments.length === 0 ? (
        <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--color-neutral-400)', fontSize: 'var(--font-sm)' }}>
          Clique em "Adicionar" para incluir uma forma de pagamento
        </div>
      ) : (
        <div>
          {/* Header labels */}
          <div style={{ ...rowStyle, backgroundColor: 'var(--color-neutral-50)', padding: '8px 20px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Forma</span>
            <span style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Valor (R$)</span>
            <span style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Conta</span>
            <span style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parcelas</span>
            <span />
          </div>
          {payments.map((p) => {
            const needsInstallments = ['CREDIT_CARD', 'CREDIARIO', 'BOLETO', 'CHEQUE'].includes(p.method)
            return (
              <div key={p.id} style={rowStyle}>
                <select value={p.method} onChange={(e) => updatePayment(p.id, 'method', e.target.value)} style={selectStyle}>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={p.amount}
                  onChange={(e) => updatePayment(p.id, 'amount', e.target.value)}
                  placeholder="0,00"
                  style={inputStyle}
                />
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
                <button
                  onClick={() => removePayment(p.id)}
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
        </div>
      )}

      {payments.length > 0 && (
        <div style={footerStyle}>
          <div style={{ display: 'flex', gap: '24px', fontSize: 'var(--font-sm)' }}>
            <span>Total da venda: <strong>{formatCurrency(total)}</strong></span>
            <span>Total pago: <strong>{formatCurrency(totalPaid)}</strong></span>
          </div>
          <span style={{
            fontWeight: 600,
            fontSize: 'var(--font-sm)',
            color: isBalanced ? 'var(--color-success-700)' : remaining > 0 ? 'var(--color-warning-700)' : 'var(--color-danger-700)',
          }}>
            {isBalanced ? 'Valores conferem' : remaining > 0 ? `Faltam ${formatCurrency(remaining)}` : `Excesso de ${formatCurrency(Math.abs(remaining))}`}
          </span>
        </div>
      )}
    </div>
  )
}
