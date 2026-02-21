'use client'

import { type CSSProperties, useCallback, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/lib/api'
import type { Account, FinanceCategory } from '@spid/shared'

export default function LancamentoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = searchParams.get('tipo') ?? 'EXPENSE'

  const { data: accounts } = useApi<Account[]>('/accounts')
  const { data: categories } = useApi<FinanceCategory[]>('/finance/categories')

  const [type, setType] = useState(initialType)
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('PAID')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filteredCategories = categories?.filter((c) => {
    if (type === 'EXPENSE') return c.type === 'EXPENSE'
    if (type === 'INCOME') return c.type === 'INCOME'
    return true
  }) ?? []

  const typeLabels: Record<string, string> = {
    EXPENSE: 'Despesa', INCOME: 'Receita', APORTE: 'Aporte', RETIRADA: 'Retirada',
  }

  const handleSubmit = useCallback(async () => {
    const errs: Record<string, string> = {}
    if (!accountId) errs.accountId = 'Selecione uma conta'
    if (!amount) errs.amount = 'Informe o valor'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSaving(true)
    try {
      await apiClient('/finance/entries', {
        method: 'POST',
        body: {
          type, categoryId: categoryId || null, accountId,
          amount: parseFloat(amount.replace(',', '.')) || 0,
          dueDate, status, notes: notes || null,
        },
      })
      router.push('/financeiro')
    } catch {
      setErrors({ submit: 'Erro ao salvar lancamento' })
    } finally {
      setSaving(false)
    }
  }, [type, categoryId, accountId, amount, dueDate, status, notes, router])

  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)', padding: '24px', boxShadow: 'var(--shadow-sm)',
  }

  const inputStyle = (hasError = false): CSSProperties => ({
    width: '100%', padding: '8px 12px', fontSize: 'var(--font-base)',
    color: 'var(--color-neutral-800)', backgroundColor: 'var(--color-white)',
    border: `1px solid ${hasError ? 'var(--color-danger-500)' : 'var(--color-neutral-300)'}`,
    borderRadius: 'var(--radius-md)', outline: 'none',
  })

  const labelStyle: CSSProperties = {
    fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-700)',
    marginBottom: '4px', display: 'block',
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.back()} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px',
            borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)', cursor: 'pointer',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>
            Novo Lancamento - {typeLabels[type] ?? type}
          </h1>
        </div>

        {errors.submit && (
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-danger-50)', border: '1px solid var(--color-danger-100)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-700)', fontSize: 'var(--font-sm)' }}>
            {errors.submit}
          </div>
        )}

        <div style={cardStyle}>
          <div className="form-grid-2">
            <div>
              <label style={labelStyle}>Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value)} style={{ ...inputStyle(), cursor: 'pointer' }}>
                {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} style={{ ...inputStyle(), cursor: 'pointer' }}>
                <option value="">Sem categoria</option>
                {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Conta *</label>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)} style={{ ...inputStyle(!!errors.accountId), cursor: 'pointer' }}>
                <option value="">Selecione...</option>
                {accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              {errors.accountId && <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-danger-600)', marginTop: '4px' }}>{errors.accountId}</p>}
            </div>
            <div>
              <label style={labelStyle}>Valor *</label>
              <input type="text" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" style={{ ...inputStyle(!!errors.amount), textAlign: 'right' }} />
              {errors.amount && <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-danger-600)', marginTop: '4px' }}>{errors.amount}</p>}
            </div>
            <div>
              <label style={labelStyle}>Data Vencimento</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle()} />
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ ...inputStyle(), cursor: 'pointer' }}>
                <option value="PAID">Pago</option>
                <option value="SCHEDULED">Agendado</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Observacoes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opcional" style={{ ...inputStyle(), minHeight: '60px', resize: 'vertical' }} />
          </div>
        </div>

        <div className="form-actions">
          <button onClick={() => router.back()} style={{ padding: '10px 20px', fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Cancelar</button>
          <button onClick={handleSubmit} disabled={saving} style={{
            padding: '10px 24px', fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--color-white)',
            backgroundColor: 'var(--color-primary-600)', border: 'none', borderRadius: 'var(--radius-md)',
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Salvando...' : 'Salvar Lancamento'}
          </button>
        </div>
      </div>
    </Layout>
  )
}
