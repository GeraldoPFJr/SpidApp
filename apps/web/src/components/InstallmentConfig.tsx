'use client'

import { type CSSProperties, useMemo } from 'react'
import { formatCurrency, formatDate } from '@/lib/format'

interface InstallmentConfigProps {
  totalAmount: number
  installments: number
  onInstallmentsChange: (value: number) => void
  intervalDays: number
  onIntervalChange: (value: number) => void
  intervalMode: 'days' | 'sameDay'
  onIntervalModeChange: (value: 'days' | 'sameDay') => void
  startDate?: string
}

export function InstallmentConfig({
  totalAmount,
  installments,
  onInstallmentsChange,
  intervalDays,
  onIntervalChange,
  intervalMode,
  onIntervalModeChange,
  startDate,
}: InstallmentConfigProps) {
  const generatedDates = useMemo(() => {
    const start = startDate ? new Date(startDate) : new Date()
    const dates: Array<{ number: number; date: Date; amount: number }> = []
    const installmentAmount = totalAmount / installments

    for (let i = 0; i < installments; i++) {
      const d = new Date(start)
      if (intervalMode === 'sameDay') {
        d.setMonth(d.getMonth() + i + 1)
      } else {
        d.setDate(d.getDate() + intervalDays * (i + 1))
      }
      dates.push({
        number: i + 1,
        date: d,
        amount: i === installments - 1
          ? totalAmount - installmentAmount * (installments - 1)
          : installmentAmount,
      })
    }
    return dates
  }, [totalAmount, installments, intervalDays, intervalMode, startDate])

  const containerStyle: CSSProperties = {
    backgroundColor: 'var(--color-neutral-50)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-neutral-200)',
    padding: '16px',
  }

  const inputRowStyle: CSSProperties = {
    display: 'flex',
    gap: '16px',
    marginBottom: '16px',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  }

  const fieldStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }

  const labelStyle: CSSProperties = {
    fontSize: 'var(--font-xs)',
    fontWeight: 500,
    color: 'var(--color-neutral-500)',
  }

  const inputStyle: CSSProperties = {
    padding: '6px 10px',
    fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-800)',
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-neutral-300)',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
    width: '100px',
    textAlign: 'center',
  }

  const radioLabelStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-700)',
    cursor: 'pointer',
  }

  const previewTableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 'var(--font-sm)',
  }

  return (
    <div style={containerStyle}>
      <p style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--color-neutral-700)', margin: '0 0 12px' }}>
        Configuracao de Parcelas
      </p>
      <div style={inputRowStyle}>
        <div style={fieldStyle}>
          <label style={labelStyle}>Parcelas</label>
          <input
            type="number"
            value={installments}
            onChange={(e) => onInstallmentsChange(Math.max(1, parseInt(e.target.value, 10) || 1))}
            min="1"
            max="48"
            style={inputStyle}
          />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Intervalo</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={radioLabelStyle}>
              <input
                type="radio"
                checked={intervalMode === 'days'}
                onChange={() => onIntervalModeChange('days')}
                style={{ accentColor: 'var(--color-primary-600)' }}
              />
              A cada
            </label>
            <input
              type="number"
              value={intervalDays}
              onChange={(e) => onIntervalChange(Math.max(1, parseInt(e.target.value, 10) || 7))}
              min="1"
              disabled={intervalMode !== 'days'}
              style={{ ...inputStyle, width: '60px', opacity: intervalMode === 'days' ? 1 : 0.5 }}
            />
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-600)', alignSelf: 'center' }}>dias</span>
          </div>
        </div>
        <div style={{ ...fieldStyle, justifyContent: 'flex-end' }}>
          <label style={radioLabelStyle}>
            <input
              type="radio"
              checked={intervalMode === 'sameDay'}
              onChange={() => onIntervalModeChange('sameDay')}
              style={{ accentColor: 'var(--color-primary-600)' }}
            />
            Mesmo dia do mes
          </label>
        </div>
      </div>

      {/* Preview */}
      {generatedDates.length > 0 && (
        <div style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-neutral-200)', overflow: 'hidden' }}>
          <table style={previewTableStyle}>
            <thead>
              <tr>
                <th style={{ padding: '6px 12px', textAlign: 'center', fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)', backgroundColor: 'var(--color-white)', borderBottom: '1px solid var(--color-neutral-200)' }}>#</th>
                <th style={{ padding: '6px 12px', textAlign: 'left', fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)', backgroundColor: 'var(--color-white)', borderBottom: '1px solid var(--color-neutral-200)' }}>Vencimento</th>
                <th style={{ padding: '6px 12px', textAlign: 'right', fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)', backgroundColor: 'var(--color-white)', borderBottom: '1px solid var(--color-neutral-200)' }}>Valor</th>
              </tr>
            </thead>
            <tbody>
              {generatedDates.map((d) => (
                <tr key={d.number}>
                  <td style={{ padding: '6px 12px', textAlign: 'center', borderBottom: '1px solid var(--color-neutral-100)', color: 'var(--color-neutral-500)' }}>{d.number}</td>
                  <td style={{ padding: '6px 12px', borderBottom: '1px solid var(--color-neutral-100)' }}>{formatDate(d.date)}</td>
                  <td style={{ padding: '6px 12px', textAlign: 'right', borderBottom: '1px solid var(--color-neutral-100)', fontWeight: 500 }}>{formatCurrency(d.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
