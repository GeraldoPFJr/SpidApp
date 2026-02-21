import { type CSSProperties, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi, useApiMutation } from '../../hooks/useApi'
import { formatBRL, getCurrentMonth, formatMonthLabel } from '../../lib/format'
import type { Account } from '@vendi/shared'

interface ClosureData {
  openingBalance: number
  totalIn: number
  totalOut: number
  expectedClosing: number
}

export function MonthlyClosurePage() {
  const navigate = useNavigate()
  const { data: accounts } = useApi<Account[]>('/accounts')
  const [month, setMonth] = useState(getCurrentMonth())
  const [accountId, setAccountId] = useState('')
  const { data: closureData, loading } = useApi<ClosureData>(
    accountId ? `/finance/closure?month=${month}&accountId=${accountId}` : null
  )
  const { execute, loading: saving } = useApiMutation('/finance/closure')
  const [countedClosing, setCountedClosing] = useState('')
  const [notes, setNotes] = useState('')

  async function handleSubmit() {
    if (!accountId || !countedClosing) return
    const result = await execute({
      month,
      accountId,
      countedClosing: parseFloat(countedClosing) || 0,
      notes: notes.trim() || null,
    })
    if (result) navigate('/financeiro', { replace: true })
  }

  const pageStyle: CSSProperties = { padding: 'var(--sp-4)', paddingBottom: '96px', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }
  const sectionStyle: CSSProperties = { backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-4)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }
  const sectionTitleStyle: CSSProperties = { fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }
  const labelStyle: CSSProperties = { fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--neutral-700)', marginBottom: 'var(--sp-1)', display: 'block' }
  const inputStyle: CSSProperties = { width: '100%', padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--font-base)', border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-md)', outline: 'none', backgroundColor: 'var(--surface)', minHeight: '44px' }
  const selectStyle: CSSProperties = { ...inputStyle, cursor: 'pointer' }
  const rowStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', padding: 'var(--sp-1) 0' }

  return (
    <div style={pageStyle} className="animate-fade-in">
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Selecao</span>
        <div className="form-row">
          <div>
            <label style={labelStyle}>Mes</label>
            <input type="month" style={inputStyle} value={month} onChange={(e) => setMonth(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Conta</label>
            <select style={selectStyle} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Selecione</option>
              {accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {closureData && (
        <div style={sectionStyle} className="animate-slide-up">
          <span style={sectionTitleStyle}>Resumo - {formatMonthLabel(month)}</span>
          <div style={rowStyle}>
            <span style={{ color: 'var(--text-secondary)' }}>Saldo Inicial</span>
            <span style={{ fontWeight: 500 }}>{formatBRL(closureData.openingBalance)}</span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: 'var(--text-secondary)' }}>Entradas</span>
            <span style={{ fontWeight: 500, color: 'var(--success-600)' }}>+{formatBRL(closureData.totalIn)}</span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: 'var(--text-secondary)' }}>Saidas</span>
            <span style={{ fontWeight: 500, color: 'var(--danger-600)' }}>-{formatBRL(closureData.totalOut)}</span>
          </div>
          <div className="divider" style={{ margin: 'var(--sp-1) 0' }} />
          <div style={{ ...rowStyle, fontWeight: 700, fontSize: 'var(--font-lg)' }}>
            <span>Saldo Esperado</span>
            <span style={{ color: 'var(--primary)' }}>{formatBRL(closureData.expectedClosing)}</span>
          </div>
        </div>
      )}

      {closureData && (
        <div style={sectionStyle} className="animate-slide-up">
          <span style={sectionTitleStyle}>Conferencia</span>
          <div>
            <label style={labelStyle}>Saldo Conferido</label>
            <input
              type="text"
              inputMode="decimal"
              style={inputStyle}
              value={countedClosing}
              onChange={(e) => setCountedClosing(e.target.value)}
              placeholder="Valor encontrado na conferencia"
            />
          </div>
          {countedClosing && (
            <div style={{
              padding: 'var(--sp-3)', borderRadius: 'var(--radius-md)',
              backgroundColor: parseFloat(countedClosing) === closureData.expectedClosing ? 'var(--success-50)' : 'var(--warning-50)',
              textAlign: 'center',
            }}>
              <span style={{
                fontWeight: 600, fontSize: 'var(--font-sm)',
                color: parseFloat(countedClosing) === closureData.expectedClosing ? 'var(--success-700)' : 'var(--warning-700)',
              }}>
                {parseFloat(countedClosing) === closureData.expectedClosing
                  ? 'Saldo confere!'
                  : `Divergencia: ${formatBRL((parseFloat(countedClosing) || 0) - closureData.expectedClosing)}`}
              </span>
            </div>
          )}
          <div>
            <label style={labelStyle}>Observacoes</label>
            <textarea className="form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observacoes sobre o fechamento..." rows={2} />
          </div>
        </div>
      )}

      {closureData && (
        <button className="btn btn-primary btn-lg btn-block" onClick={handleSubmit} disabled={saving || !countedClosing}>
          {saving ? 'Salvando...' : 'Salvar Fechamento'}
        </button>
      )}
    </div>
  )
}
