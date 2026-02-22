import { type CSSProperties, useState } from 'react'
import { useApi, useApiMutation } from '../../hooks/useApi'
import { formatBRL } from '../../lib/format'
import type { Account } from '@spid/shared'

interface AccountWithBalance extends Account {
  balance: number
}

export function AccountListPage() {
  const { data: accounts, loading, error, refetch } = useApi<AccountWithBalance[]>('/accounts/summary')
  const { execute, loading: creating, error: createError } = useApiMutation('/accounts')
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<'CASH' | 'BANK' | 'OTHER'>('BANK')

  async function handleCreate() {
    if (!newName.trim()) return
    const result = await execute({ name: newName.trim(), type: newType })
    if (!result) {
      return
    }
    setShowForm(false)
    setNewName('')
    refetch()
  }

  const pageStyle: CSSProperties = { padding: 'var(--sp-4)', paddingBottom: '96px', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }
  const sectionStyle: CSSProperties = { backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-4)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }
  const inputStyle: CSSProperties = { width: '100%', padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--font-base)', border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-md)', outline: 'none', backgroundColor: 'var(--surface)', minHeight: '44px' }
  const selectStyle: CSSProperties = { ...inputStyle, cursor: 'pointer' }

  const TYPE_LABELS: Record<string, string> = { CASH: 'Dinheiro', BANK: 'Banco', OTHER: 'Outra' }

  if (loading) {
    return <div style={pageStyle}>{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton skeleton-card" />)}</div>
  }

  return (
    <div style={pageStyle} className="animate-fade-in">
      {error && (
        <div className="alert alert-danger">
          <span>Erro ao carregar contas: {error}</span>
        </div>
      )}

      <button className="btn btn-primary btn-block" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancelar' : '+ Nova Conta'}
      </button>

      {showForm && (
        <div style={sectionStyle} className="animate-slide-up">
          <div>
            <label style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--neutral-700)', display: 'block', marginBottom: 'var(--sp-1)' }}>Nome</label>
            <input style={inputStyle} value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Conta Nubank" />
          </div>
          <div>
            <label style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--neutral-700)', display: 'block', marginBottom: 'var(--sp-1)' }}>Tipo</label>
            <select style={selectStyle} value={newType} onChange={(e) => setNewType(e.target.value as any)}>
              <option value="CASH">Dinheiro</option>
              <option value="BANK">Banco</option>
              <option value="OTHER">Outra</option>
            </select>
          </div>
          {createError && (
            <div className="alert alert-danger" style={{ marginBottom: 0 }}>
              <span>{createError}</span>
            </div>
          )}
          <button className="btn btn-primary btn-block" onClick={handleCreate} disabled={creating}>
            {creating ? 'Criando...' : 'Criar Conta'}
          </button>
        </div>
      )}

      {accounts?.map((acc) => (
        <div key={acc.id} style={{
          ...sectionStyle,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--sp-2)',
        }}>
          <div>
            <span style={{ fontSize: 'var(--font-base)', fontWeight: 600, display: 'block' }}>{acc.name}</span>
            <span className="badge badge-default" style={{ marginTop: 'var(--sp-1)' }}>{TYPE_LABELS[acc.type] ?? acc.type}</span>
          </div>
          <span style={{
            fontSize: 'var(--font-xl)', fontWeight: 700,
            color: acc.balance >= 0 ? 'var(--text-primary)' : 'var(--danger-600)',
          }}>
            {formatBRL(acc.balance)}
          </span>
        </div>
      ))}
    </div>
  )
}
