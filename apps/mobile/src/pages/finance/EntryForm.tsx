import { type CSSProperties, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useApi, useApiMutation } from '../../hooks/useApi'
import type { Account, FinanceCategory, FinanceEntryType } from '@vendi/shared'

const TYPE_OPTIONS: { value: FinanceEntryType; label: string }[] = [
  { value: 'EXPENSE', label: 'Despesa' },
  { value: 'INCOME', label: 'Receita' },
  { value: 'APORTE', label: 'Aporte' },
  { value: 'RETIRADA', label: 'Retirada' },
]

export function EntryFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preType = (searchParams.get('type') as FinanceEntryType) || 'EXPENSE'

  const { data: accounts } = useApi<Account[]>('/accounts')
  const { data: categories } = useApi<FinanceCategory[]>('/finance/categories')
  const { execute, loading: saving } = useApiMutation('/finance/entries')

  const [type, setType] = useState<FinanceEntryType>(preType)
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [amount, setAmount] = useState(0)
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')

  const filteredCategories = categories?.filter((c) => {
    if (type === 'EXPENSE') return c.type === 'EXPENSE'
    if (type === 'INCOME') return c.type === 'INCOME'
    return false
  }) ?? []

  async function handleSubmit() {
    if (!accountId || amount <= 0) return
    const payload = {
      type,
      categoryId: categoryId || null,
      accountId,
      amount,
      dueDate: dueDate || null,
      notes: notes.trim() || null,
    }
    const result = await execute(payload)
    if (result) navigate('/financeiro', { replace: true })
  }

  const pageStyle: CSSProperties = { padding: 'var(--sp-4)', paddingBottom: '96px', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }
  const sectionStyle: CSSProperties = { backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-4)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }
  const sectionTitleStyle: CSSProperties = { fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }
  const labelStyle: CSSProperties = { fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--neutral-700)', marginBottom: 'var(--sp-1)', display: 'block' }
  const inputStyle: CSSProperties = { width: '100%', padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--font-base)', border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-md)', outline: 'none', backgroundColor: 'var(--surface)', minHeight: '44px' }
  const selectStyle: CSSProperties = { ...inputStyle, cursor: 'pointer' }

  return (
    <div style={pageStyle} className="animate-fade-in">
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Tipo</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
          {TYPE_OPTIONS.map((opt) => (
            <button key={opt.value} style={{
              padding: 'var(--sp-2) var(--sp-3)',
              border: `1px solid ${type === opt.value ? 'var(--primary)' : 'var(--neutral-300)'}`,
              borderRadius: 'var(--radius-md)',
              backgroundColor: type === opt.value ? 'var(--primary-50)' : 'var(--surface)',
              color: type === opt.value ? 'var(--primary-700)' : 'var(--text-secondary)',
              fontWeight: 500, fontSize: 'var(--font-sm)', cursor: 'pointer', minHeight: '44px',
              transition: 'all var(--transition-fast)',
            }} onClick={() => { setType(opt.value); setCategoryId('') }}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Detalhes</span>

        {filteredCategories.length > 0 && (
          <div>
            <label style={labelStyle}>Categoria</label>
            <select style={selectStyle} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Selecione</option>
              {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        <div>
          <label style={labelStyle}>Conta *</label>
          <select style={selectStyle} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Selecione a conta</option>
            {accounts?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Valor *</label>
          <input
            type="text"
            inputMode="decimal"
            style={inputStyle}
            value={amount > 0 ? amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : ''}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '')
              setAmount(parseInt(raw || '0', 10) / 100)
            }}
            placeholder="R$ 0,00"
          />
        </div>

        <div>
          <label style={labelStyle}>Data de Vencimento</label>
          <input type="date" style={inputStyle} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <div>
          <label style={labelStyle}>Observacoes</label>
          <textarea className="form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Observacoes..." rows={2} />
        </div>
      </div>

      <button className="btn btn-primary btn-lg btn-block" onClick={handleSubmit} disabled={saving || !accountId || amount <= 0}>
        {saving ? 'Salvando...' : 'Registrar Lancamento'}
      </button>
    </div>
  )
}
