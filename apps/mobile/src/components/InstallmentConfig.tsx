import { type CSSProperties, useEffect, useMemo, useState } from 'react'

export interface InstallmentPreview {
  number: number
  dueDate: string
  amount: number
}

interface InstallmentConfigProps {
  totalAmount: number
  onChange: (installments: InstallmentPreview[]) => void
}

type IntervalType = 'days' | 'same_day'

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

function formatDateBR(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function InstallmentConfig({ totalAmount, onChange }: InstallmentConfigProps) {
  const [count, setCount] = useState(1)
  const [intervalType, setIntervalType] = useState<IntervalType>('days')
  const [intervalDays, setIntervalDays] = useState(30)

  const installments = useMemo(() => {
    if (count <= 0 || totalAmount <= 0) return []
    const baseAmount = Math.floor((totalAmount * 100) / count) / 100
    const remainder = Math.round((totalAmount - baseAmount * count) * 100) / 100
    const today = new Date()
    const result: InstallmentPreview[] = []

    for (let i = 0; i < count; i++) {
      let dueDate: Date
      if (intervalType === 'days') {
        dueDate = addDays(today, intervalDays * (i + 1))
      } else {
        dueDate = addMonths(today, i + 1)
      }
      result.push({
        number: i + 1,
        dueDate: formatDateISO(dueDate),
        amount: i === 0 ? baseAmount + remainder : baseAmount,
      })
    }
    return result
  }, [count, intervalType, intervalDays, totalAmount])

  useEffect(() => {
    onChange(installments)
  }, [installments, onChange])

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--sp-3)',
  }

  const rowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 'var(--sp-2)',
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

  const previewStyle: CSSProperties = {
    backgroundColor: 'var(--neutral-50)',
    borderRadius: 'var(--radius-md)',
    padding: 'var(--sp-3)',
  }

  const previewRowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--sp-1) 0',
    fontSize: 'var(--font-sm)',
  }

  return (
    <div style={containerStyle}>
      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Parcelas</label>
          <input
            type="number"
            style={inputStyle}
            value={count}
            onChange={(e) => setCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
            min={1}
            max={36}
            inputMode="numeric"
          />
        </div>
        <div>
          <label style={labelStyle}>Intervalo</label>
          <select
            style={selectStyle}
            value={intervalType}
            onChange={(e) => setIntervalType(e.target.value as IntervalType)}
          >
            <option value="days">Dias</option>
            <option value="same_day">Mesmo dia do mes</option>
          </select>
        </div>
      </div>

      {intervalType === 'days' && (
        <div>
          <label style={labelStyle}>Dias entre parcelas</label>
          <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
            {[7, 15, 30].map((d) => (
              <button
                key={d}
                type="button"
                style={{
                  flex: 1,
                  padding: 'var(--sp-2)',
                  border: `1px solid ${intervalDays === d ? 'var(--primary)' : 'var(--neutral-300)'}`,
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: intervalDays === d ? 'var(--primary-50)' : 'var(--surface)',
                  color: intervalDays === d ? 'var(--primary-700)' : 'var(--text-secondary)',
                  fontWeight: 500,
                  fontSize: 'var(--font-sm)',
                  cursor: 'pointer',
                  minHeight: '40px',
                  transition: 'all var(--transition-fast)',
                }}
                onClick={() => setIntervalDays(d)}
              >
                {d} dias
              </button>
            ))}
          </div>
        </div>
      )}

      {installments.length > 0 && (
        <div style={previewStyle}>
          <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Preview das Parcelas
          </span>
          {installments.map((inst) => (
            <div key={inst.number} style={previewRowStyle}>
              <span style={{ color: 'var(--text-secondary)' }}>
                {inst.number}/{count}
              </span>
              <span style={{ color: 'var(--text-secondary)' }}>
                {formatDateBR(new Date(inst.dueDate))}
              </span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                R$ {inst.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
