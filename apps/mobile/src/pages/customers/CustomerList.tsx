import { type CSSProperties, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import type { Customer } from '@xpid/shared'

interface CustomerWithOverdue extends Customer {
  overdueAmount?: number
  overdueCount?: number
}

export function CustomerListPage() {
  const navigate = useNavigate()
  const { data: customers, loading, error } = useApi<CustomerWithOverdue[]>('/customers')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!customers) return []
    if (!search) return customers
    const q = search.toLowerCase()
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q))
    )
  }, [customers, search])

  const pageStyle: CSSProperties = {
    padding: 'var(--sp-4)',
    paddingBottom: '96px',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--sp-4)',
  }

  const searchStyle: CSSProperties = {
    width: '100%',
    padding: 'var(--sp-2) var(--sp-3)',
    fontSize: 'var(--font-base)',
    border: '1px solid var(--neutral-300)',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    backgroundColor: 'var(--surface)',
    minHeight: '44px',
  }

  const listGroupStyle: CSSProperties = {
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
  }

  const itemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--sp-3) var(--sp-4)',
    backgroundColor: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
    minHeight: '56px',
    transition: 'background-color var(--transition-fast)',
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        <div className="skeleton skeleton-text" style={{ height: '44px' }} />
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {error && (
        <div className="alert alert-danger">
          <span>Erro ao carregar clientes: {error}</span>
        </div>
      )}

      <input
        type="text"
        placeholder="Buscar por nome ou telefone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={searchStyle}
      />

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--sp-12)', color: 'var(--text-muted)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto', color: 'var(--neutral-300)', marginBottom: 'var(--sp-4)' }} strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <p style={{ fontWeight: 600, fontSize: 'var(--font-lg)', color: 'var(--neutral-700)', marginBottom: 'var(--sp-2)' }}>
            Nenhum cliente encontrado
          </p>
          <p style={{ fontSize: 'var(--font-sm)' }}>
            {search ? 'Tente alterar a busca.' : 'Cadastre seu primeiro cliente.'}
          </p>
        </div>
      ) : (
        <div style={listGroupStyle}>
          {filtered.map((customer, idx) => (
            <div
              key={customer.id}
              style={{
                ...itemStyle,
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              }}
              onClick={() => navigate(`/clientes/${customer.id}`)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <span style={{ fontSize: 'var(--font-base)', fontWeight: 500, color: 'var(--text-primary)' }} className="text-truncate">
                    {customer.name}
                  </span>
                  {customer.overdueAmount && customer.overdueAmount > 0 && (
                    <span className="badge badge-danger">Inadimplente</span>
                  )}
                </div>
                {customer.phone && (
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '2px', display: 'block' }}>
                    {customer.phone}
                  </span>
                )}
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          ))}
        </div>
      )}

      <button
        className="fab"
        onClick={() => navigate('/clientes/novo')}
        aria-label="Adicionar cliente"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  )
}
