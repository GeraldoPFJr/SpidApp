import { type CSSProperties, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import type { Product, Category } from '@spid/shared'

interface ProductWithStock extends Product {
  categoryName?: string
  stockBase?: number
}

export function ProductListPage() {
  const navigate = useNavigate()
  const { data: products, loading, error } = useApi<ProductWithStock[]>('/products')
  const { data: categories } = useApi<Category[]>('/categories')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const filtered = useMemo(() => {
    if (!products) return []
    return products.filter((p) => {
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.code && p.code.toLowerCase().includes(search.toLowerCase()))
      const matchCategory = !categoryFilter || p.categoryId === categoryFilter
      return matchSearch && matchCategory
    })
  }, [products, search, categoryFilter])

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
    transition: 'border-color var(--transition-fast)',
  }

  const filterRowStyle: CSSProperties = {
    display: 'flex',
    gap: 'var(--sp-2)',
    overflowX: 'auto',
    paddingBottom: 'var(--sp-1)',
  }

  const chipStyle = (active: boolean): CSSProperties => ({
    padding: 'var(--sp-1) var(--sp-3)',
    borderRadius: 'var(--radius-full)',
    fontSize: 'var(--font-sm)',
    fontWeight: 500,
    border: 'none',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    backgroundColor: active ? 'var(--primary-100)' : 'var(--neutral-100)',
    color: active ? 'var(--primary-700)' : 'var(--neutral-700)',
    transition: 'all var(--transition-fast)',
  })

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
          <span>Erro ao carregar produtos: {error}</span>
        </div>
      )}

      <input
        type="text"
        placeholder="Buscar por nome ou codigo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={searchStyle}
      />

      {categories && categories.length > 0 && (
        <div style={filterRowStyle}>
          <button
            style={chipStyle(!categoryFilter)}
            onClick={() => setCategoryFilter('')}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              style={chipStyle(categoryFilter === cat.id)}
              onClick={() => setCategoryFilter(cat.id === categoryFilter ? '' : cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--sp-12)', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--sp-4)' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto', color: 'var(--neutral-300)' }}>
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p style={{ fontWeight: 600, fontSize: 'var(--font-lg)', color: 'var(--neutral-700)', marginBottom: 'var(--sp-2)' }}>
            Nenhum produto encontrado
          </p>
          <p style={{ fontSize: 'var(--font-sm)' }}>
            {search || categoryFilter ? 'Tente alterar os filtros.' : 'Cadastre seu primeiro produto.'}
          </p>
        </div>
      ) : (
        <div style={listGroupStyle}>
          {filtered.map((product, idx) => (
            <div
              key={product.id}
              style={{
                ...itemStyle,
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              }}
              onClick={() => navigate(`/produtos/${product.id}`)}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <span style={{ fontSize: 'var(--font-base)', fontWeight: 500, color: 'var(--text-primary)' }} className="text-truncate">
                    {product.name}
                  </span>
                  {!product.active && (
                    <span className="badge badge-default" style={{ fontSize: '10px' }}>Inativo</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginTop: '2px' }}>
                  {product.code && (
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                      {product.code}
                    </span>
                  )}
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)' }}>
                    {product.categoryName ?? ''}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {product.stockBase !== undefined && (
                  <span style={{
                    fontSize: 'var(--font-sm)',
                    fontWeight: 600,
                    color: product.minStock && product.stockBase < product.minStock
                      ? 'var(--danger-600)'
                      : 'var(--text-primary)',
                  }}>
                    {product.stockBase} un
                  </span>
                )}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'var(--sp-2)' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button
        className="fab"
        onClick={() => navigate('/produtos/novo')}
        aria-label="Adicionar produto"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  )
}
