import { type CSSProperties, useCallback } from 'react'
import { InstallmentConfig, type InstallmentPreview } from './InstallmentConfig'
import { formatBRL } from '../lib/format'
import type { PaymentMethod } from '@xpid/shared'

export interface PaymentEntry {
  id: string
  method: PaymentMethod
  amount: number
  installments?: number
  installmentPreviews?: InstallmentPreview[]
  accountId?: string
}

interface PaymentSplitProps {
  total: number
  payments: PaymentEntry[]
  onChange: (payments: PaymentEntry[]) => void
  accounts?: Array<{ id: string; name: string }>
}

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Dinheiro' },
  { value: 'PIX', label: 'Pix' },
  { value: 'DEBIT_CARD', label: 'Cartao Debito' },
  { value: 'CREDIT_CARD', label: 'Cartao Credito' },
  { value: 'CREDIARIO', label: 'Crediario' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'CHEQUE', label: 'Cheque' },
]

const NEEDS_INSTALLMENT_CONFIG: PaymentMethod[] = ['CREDIARIO', 'BOLETO', 'CHEQUE']

let nextId = 1

export function PaymentSplit({ total, payments, onChange, accounts }: PaymentSplitProps) {
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const diff = Math.round((total - totalPaid) * 100) / 100

  function addPayment() {
    const remaining = Math.max(0, diff)
    onChange([
      ...payments,
      {
        id: `pay_${nextId++}`,
        method: 'CASH',
        amount: remaining,
      },
    ])
  }

  function updatePayment(id: string, updates: Partial<PaymentEntry>) {
    onChange(
      payments.map((p) => (p.id === id ? { ...p, ...updates } : p))
    )
  }

  function removePayment(id: string) {
    onChange(payments.filter((p) => p.id !== id))
  }

  const handleInstallmentChange = useCallback(
    (paymentId: string, installments: InstallmentPreview[]) => {
      onChange(
        payments.map((p) =>
          p.id === paymentId ? { ...p, installmentPreviews: installments } : p
        )
      )
    },
    [payments, onChange]
  )

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--sp-3)',
  }

  const paymentCardStyle: CSSProperties = {
    backgroundColor: 'var(--neutral-50)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--sp-3)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--sp-2)',
    border: '1px solid var(--border)',
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
    minHeight: '40px',
  }

  const selectStyle: CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
  }

  const totalBarStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--sp-3) var(--sp-4)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: Math.abs(diff) < 0.01 ? 'var(--success-50)' : 'var(--warning-50)',
    border: `1px solid ${Math.abs(diff) < 0.01 ? 'var(--success-100)' : 'var(--warning-100)'}`,
  }

  return (
    <div style={containerStyle}>
      {payments.map((payment) => (
        <div key={payment.id} style={paymentCardStyle} className="animate-slide-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Pagamento
            </span>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--danger-500)',
                cursor: 'pointer',
                padding: 'var(--sp-1)',
                fontSize: 'var(--font-sm)',
              }}
              onClick={() => removePayment(payment.id)}
              aria-label="Remover pagamento"
            >
              Remover
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
            <div>
              <label style={labelStyle}>Forma</label>
              <select
                style={selectStyle}
                value={payment.method}
                onChange={(e) =>
                  updatePayment(payment.id, {
                    method: e.target.value as PaymentMethod,
                    installments: undefined,
                    installmentPreviews: undefined,
                  })
                }
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Valor</label>
              <input
                type="text"
                inputMode="decimal"
                style={inputStyle}
                value={payment.amount > 0 ? payment.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
                onChange={(e) => {
                  const raw = e.target.value.replace(/\D/g, '')
                  const val = parseInt(raw || '0', 10) / 100
                  updatePayment(payment.id, { amount: val })
                }}
                placeholder="R$ 0,00"
              />
            </div>
          </div>

          {payment.method === 'CREDIT_CARD' && (
            <div>
              <label style={labelStyle}>Parcelas do cartao</label>
              <select
                style={selectStyle}
                value={payment.installments ?? 1}
                onChange={(e) =>
                  updatePayment(payment.id, { installments: parseInt(e.target.value, 10) })
                }
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}x de {formatBRL(payment.amount / n)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {NEEDS_INSTALLMENT_CONFIG.includes(payment.method) && (
            <InstallmentConfig
              totalAmount={payment.amount}
              onChange={(inst) => handleInstallmentChange(payment.id, inst)}
            />
          )}

          {accounts && accounts.length > 0 && (
            <div>
              <label style={labelStyle}>Conta destino</label>
              <select
                style={selectStyle}
                value={payment.accountId ?? ''}
                onChange={(e) => updatePayment(payment.id, { accountId: e.target.value })}
              >
                <option value="">Selecione a conta</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        className="btn btn-secondary btn-block"
        onClick={addPayment}
        style={{ borderStyle: 'dashed' }}
      >
        + Adicionar Forma de Pagamento
      </button>

      <div style={totalBarStyle}>
        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500 }}>
          {Math.abs(diff) < 0.01 ? 'Pagamento completo' : diff > 0 ? `Falta ${formatBRL(diff)}` : `Excede em ${formatBRL(Math.abs(diff))}`}
        </span>
        <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-primary)' }}>
          {formatBRL(totalPaid)} / {formatBRL(total)}
        </span>
      </div>
    </div>
  )
}
