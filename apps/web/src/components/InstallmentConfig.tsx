'use client'

import { type CSSProperties, useMemo } from 'react'
import { formatCurrency, formatDate } from '@/lib/format'
import { useMediaQuery } from '@/hooks/useMediaQuery'

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
  const { isMobile } = useMediaQuery()

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

  /* ── Styles ── */

  const containerStyle: CSSProperties = {
    backgroundColor: 'var(--color-neutral-50)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-neutral-200)',
    padding: isMobile ? '12px' : '16px',
  }

  const inputRowStyle: CSSProperties = {
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? '16px' : '16px',
    marginBottom: '16px',
    alignItems: isMobile ? 'stretch' : 'flex-end',
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
    padding: isMobile ? '12px' : '6px 10px',
    fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-800)',
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-neutral-300)',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
    width: isMobile ? '100%' : '100px',
    textAlign: 'center',
    minHeight: isMobile ? '44px' : 'auto',
    transition: 'border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  }

  const radioLabelStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-700)',
    cursor: 'pointer',
    minHeight: isMobile ? '44px' : 'auto',
    padding: isMobile ? '4px 0' : '0',
  }

  const radioInputStyle: CSSProperties = {
    accentColor: 'var(--color-primary-600)',
    width: isMobile ? '20px' : 'auto',
    height: isMobile ? '20px' : 'auto',
    flexShrink: 0,
  }

  const previewTableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 'var(--font-sm)',
  }

  const thStyle: CSSProperties = {
    padding: isMobile ? '8px' : '6px 12px',
    fontSize: 'var(--font-xs)',
    fontWeight: 500,
    color: 'var(--color-neutral-500)',
    backgroundColor: 'var(--color-white)',
    borderBottom: '1px solid var(--color-neutral-200)',
    whiteSpace: 'nowrap',
  }

  const tdStyle: CSSProperties = {
    padding: isMobile ? '10px 8px' : '6px 12px',
    borderBottom: '1px solid var(--color-neutral-100)',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={containerStyle}>
      <p style={{
        fontSize: 'var(--font-sm)',
        fontWeight: 600,
        color: 'var(--color-neutral-700)',
        margin: '0 0 12px',
      }}>
        Configuracao de Parcelas
      </p>

      <div style={inputRowStyle}>
        {/* ── Parcelas input ── */}
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

        {/* ── Interval mode: "A cada X dias" ── */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Intervalo</label>
          {isMobile ? (
            /* Mobile: stacked radio + input */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: intervalMode === 'days' ? 'var(--color-primary-50)' : 'var(--color-white)',
                border: `1px solid ${intervalMode === 'days' ? 'var(--color-primary-200)' : 'var(--color-neutral-200)'}`,
                borderRadius: 'var(--radius-sm)',
                transition: 'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                <label style={{ ...radioLabelStyle, flex: 1 }}>
                  <input
                    type="radio"
                    checked={intervalMode === 'days'}
                    onChange={() => onIntervalModeChange('days')}
                    style={radioInputStyle}
                  />
                  A cada
                </label>
                <input
                  type="number"
                  value={intervalDays}
                  onChange={(e) => onIntervalChange(Math.max(1, parseInt(e.target.value, 10) || 7))}
                  min="1"
                  disabled={intervalMode !== 'days'}
                  style={{
                    ...inputStyle,
                    width: '72px',
                    opacity: intervalMode === 'days' ? 1 : 0.4,
                  }}
                />
                <span style={{
                  fontSize: 'var(--font-sm)',
                  color: 'var(--color-neutral-600)',
                }}>
                  dias
                </span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: intervalMode === 'sameDay' ? 'var(--color-primary-50)' : 'var(--color-white)',
                border: `1px solid ${intervalMode === 'sameDay' ? 'var(--color-primary-200)' : 'var(--color-neutral-200)'}`,
                borderRadius: 'var(--radius-sm)',
                minHeight: '44px',
                transition: 'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1), border-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}>
                <label style={radioLabelStyle}>
                  <input
                    type="radio"
                    checked={intervalMode === 'sameDay'}
                    onChange={() => onIntervalModeChange('sameDay')}
                    style={radioInputStyle}
                  />
                  Mesmo dia do mes
                </label>
              </div>
            </div>
          ) : (
            /* Desktop: inline radio + input */
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
          )}
        </div>

        {/* ── "Mesmo dia do mes" radio (desktop only — on mobile it's in the group above) ── */}
        {!isMobile && (
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
        )}
      </div>

      {/* ── Preview table ── */}
      {generatedDates.length > 0 && (
        <div style={{
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-neutral-200)',
          overflow: 'hidden',
        }}>
          {/* Scrollable wrapper for mobile */}
          <div style={{
            overflowX: isMobile ? 'auto' : 'visible',
            WebkitOverflowScrolling: 'touch',
          }}>
            <table style={{
              ...previewTableStyle,
              minWidth: isMobile ? '280px' : 'auto',
            }}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, textAlign: 'center' }}>#</th>
                  <th style={{ ...thStyle, textAlign: 'left' }}>Vencimento</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {generatedDates.map((d) => (
                  <tr key={d.number}>
                    <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--color-neutral-500)' }}>{d.number}</td>
                    <td style={tdStyle}>{formatDate(d.date)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>{formatCurrency(d.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
