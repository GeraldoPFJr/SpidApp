import { type CSSProperties, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import type { Supplier } from '@vendi/shared'

export function SupplierListPage() {
  const navigate = useNavigate()
  const { data: suppliers, loading } = useApi<Supplier[]>('/suppliers')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!suppliers) return []
    if (!search) return suppliers
    const q = search.toLowerCase()
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.city && s.city.toLowerCase().includes(q))
    )
  }, [suppliers, search])

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
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-card" />
        ))}
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <input
        type="text"
        placeholder="Buscar por nome ou cidade..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={searchStyle}
      />

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--sp-12)', color: 'var(--text-muted)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto', color: 'var(--neutral-300)', marginBottom: 'var(--sp-4)' }} strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <p style={{ fontWeight: 600, fontSize: 'var(--font-lg)', color: 'var(--neutral-700)', marginBottom: 'var(--sp-2)' }}>
            Nenhum fornecedor encontrado
          </p>
          <p style={{ fontSize: 'var(--font-sm)' }}>
            {search ? 'Tente alterar a busca.' : 'Cadastre seu primeiro fornecedor.'}
          </p>
        </div>
      ) : (
        <div style={listGroupStyle}>
          {filtered.map((supplier, idx) => (
            <div
              key={supplier.id}
              style={{
                ...itemStyle,
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              }}
              onClick={() => navigate(`/fornecedores/${supplier.id}/editar`)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 'var(--font-base)', fontWeight: 500, color: 'var(--text-primary)' }} className="text-truncate">
                  {supplier.name}
                </span>
                <div style={{ display: 'flex', gap: 'var(--sp-2)', marginTop: '2px' }}>
                  {supplier.city && (
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                      {supplier.city}
                    </span>
                  )}
                  {supplier.productTypes && (
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                      {supplier.productTypes}
                    </span>
                  )}
                </div>
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
        onClick={() => navigate('/fornecedores/novo')}
        aria-label="Adicionar fornecedor"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  )
}
