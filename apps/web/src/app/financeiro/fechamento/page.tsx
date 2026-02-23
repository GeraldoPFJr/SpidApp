'use client'

import { type CSSProperties, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { useApi } from '@/hooks/useApi'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { apiClient } from '@/lib/api'
import { formatCurrency, getCurrentMonth } from '@/lib/format'
import type { Account } from '@xpid/shared'

interface ClosureData {
  openingBalance: number
  totalIn: number
  totalOut: number
  expectedClosing: number
}

export default function FechamentoPage() {
  const router = useRouter()
  const { isMobile } = useMediaQuery()
  const { data: accounts } = useApi<Account[]>('/accounts')

  const [month, setMonth] = useState(getCurrentMonth)
  const [accountId, setAccountId] = useState('')
  const [countedClosing, setCountedClosing] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: closureData } = useApi<ClosureData>(
    accountId ? `/finance/closure-preview?month=${month}&accountId=${accountId}` : '',
  )

  const expected = closureData?.expectedClosing ?? 0
  const counted = parseFloat(countedClosing.replace(',', '.'))
  const divergence = isNaN(counted) ? null : counted - expected

  const handleSave = useCallback(async () => {
    if (!accountId || isNaN(counted)) return
    setSaving(true)
    setSubmitError(null)
    try {
      await apiClient('/finance/closures', {
        method: 'POST',
        body: { month, accountId, countedClosing: counted, notes: notes || null },
      })
      router.push('/financeiro')
    } catch {
      setSubmitError('Erro ao salvar fechamento. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }, [month, accountId, counted, notes, router])

  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)', padding: isMobile ? '16px' : '24px', boxShadow: 'var(--shadow-sm)',
  }

  const inputStyle: CSSProperties = {
    width: '100%', padding: isMobile ? '10px 12px' : '8px 12px',
    fontSize: 'var(--font-base)',
    color: 'var(--color-neutral-800)', backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)', outline: 'none',
    minHeight: isMobile ? '44px' : 'auto',
  }

  const labelStyle: CSSProperties = {
    fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-700)',
    marginBottom: '4px', display: 'block',
  }

  const infoLabelStyle: CSSProperties = {
    fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)',
    textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px',
  }

  const infoValueStyle: CSSProperties = {
    fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0,
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px', maxWidth: '700px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.back()} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px',
            borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)', cursor: 'pointer',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <h1 style={{ fontSize: isMobile ? 'var(--font-xl)' : 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>Fechamento Mensal</h1>
        </div>

        {submitError && (
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-danger-50)', border: '1px solid var(--color-danger-100)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-700)', fontSize: 'var(--font-sm)' }}>
            {submitError}
          </div>
        )}

        <div style={cardStyle}>
          <div className="form-grid-2">
            <div>
              <label style={labelStyle}>Mes</label>
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Conta</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="">Selecione...</option>
                {accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {closureData && accountId && (
          <>
            <div style={cardStyle}>
              <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 20px' }}>Resumo</h2>
              <div className="stats-grid">
                <div><p style={infoLabelStyle}>Saldo Inicial</p><p style={infoValueStyle}>{formatCurrency(closureData.openingBalance)}</p></div>
                <div><p style={infoLabelStyle}>Entradas</p><p style={{ ...infoValueStyle, color: 'var(--color-success-600)' }}>{formatCurrency(closureData.totalIn)}</p></div>
                <div><p style={infoLabelStyle}>Saidas</p><p style={{ ...infoValueStyle, color: 'var(--color-danger-600)' }}>{formatCurrency(closureData.totalOut)}</p></div>
                <div><p style={infoLabelStyle}>Saldo Esperado</p><p style={infoValueStyle}>{formatCurrency(expected)}</p></div>
              </div>
            </div>

            <div style={cardStyle}>
              <div className="form-grid-2">
                <div>
                  <label style={labelStyle}>Saldo Conferido</label>
                  <input type="text" value={countedClosing} onChange={(e) => setCountedClosing(e.target.value)} placeholder="0,00" style={{ ...inputStyle, textAlign: 'right' }} />
                </div>
                <div>
                  <label style={labelStyle}>Divergencia</label>
                  <p style={{
                    fontSize: isMobile ? '1rem' : '1.25rem', fontWeight: 700, margin: '8px 0 0',
                    color: divergence == null ? 'var(--color-neutral-400)' : divergence === 0 ? 'var(--color-success-600)' : 'var(--color-danger-600)',
                  }}>
                    {divergence == null ? '-' : (divergence > 0 ? '+' : '') + formatCurrency(divergence)}
                  </p>
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <label style={labelStyle}>Observacoes</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observacoes sobre divergencias..." style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} />
              </div>
            </div>

            <div className="form-actions">
              <button onClick={() => router.back()} style={{ padding: '10px 20px', fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)', cursor: 'pointer', minHeight: '44px' }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving || isNaN(counted)} style={{
                padding: '10px 24px', fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--color-white)',
                backgroundColor: 'var(--color-primary-600)', border: 'none', borderRadius: 'var(--radius-md)',
                cursor: (saving || isNaN(counted)) ? 'not-allowed' : 'pointer', opacity: (saving || isNaN(counted)) ? 0.5 : 1,
                minHeight: '44px',
              }}>
                {saving ? 'Salvando...' : 'Salvar Fechamento'}
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
