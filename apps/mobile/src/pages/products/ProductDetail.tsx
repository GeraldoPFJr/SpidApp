import type { CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { formatBRL, formatDate } from '../../lib/format'
import type { ProductUnit, ProductPrice, PriceTier, InventoryMovement } from '@spid/shared'

interface ProductDetail {
  id: string
  name: string
  code: string | null
  categoryName: string
  subcategoryName: string | null
  minStock: number | null
  active: boolean
  stockBase: number
  units: (ProductUnit & { equivalentQty?: number })[]
  prices: (ProductPrice & { tierName: string; unitName: string })[]
  recentMovements: (InventoryMovement & { productName?: string })[]
}

export function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: product, loading } = useApi<ProductDetail>(id ? `/products/${id}` : null)

  const pageStyle: CSSProperties = {
    padding: 'var(--sp-4)',
    paddingBottom: '96px',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--sp-4)',
  }

  const sectionStyle: CSSProperties = {
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--sp-4)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 'var(--sp-3)',
  }

  const rowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--sp-2) 0',
  }

  const labelStyle: CSSProperties = {
    fontSize: 'var(--font-sm)',
    color: 'var(--text-secondary)',
  }

  const valueStyle: CSSProperties = {
    fontSize: 'var(--font-sm)',
    fontWeight: 500,
    color: 'var(--text-primary)',
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-card" style={{ height: '120px' }} />
        ))}
      </div>
    )
  }

  if (!product) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', padding: 'var(--sp-12)', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, fontSize: 'var(--font-lg)', color: 'var(--neutral-700)' }}>
            Produto nao encontrado
          </p>
        </div>
      </div>
    )
  }

  const stockIsLow = product.minStock != null && product.stockBase < product.minStock

  return (
    <div style={pageStyle} className="animate-fade-in">
      {/* Info basica */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--sp-3)' }}>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {product.name}
          </h2>
          <span
            className={`badge ${product.active ? 'badge-success' : 'badge-default'}`}
          >
            {product.active ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        {product.code && (
          <div style={rowStyle}>
            <span style={labelStyle}>Codigo</span>
            <span style={valueStyle}>{product.code}</span>
          </div>
        )}
        <div style={rowStyle}>
          <span style={labelStyle}>Categoria</span>
          <span style={valueStyle}>{product.categoryName}</span>
        </div>
        {product.subcategoryName && (
          <div style={rowStyle}>
            <span style={labelStyle}>Subcategoria</span>
            <span style={valueStyle}>{product.subcategoryName}</span>
          </div>
        )}
        {product.minStock != null && (
          <div style={rowStyle}>
            <span style={labelStyle}>Estoque Minimo</span>
            <span style={valueStyle}>{product.minStock} un</span>
          </div>
        )}
      </div>

      {/* Estoque */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Estoque</span>

        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--sp-2)',
          marginBottom: 'var(--sp-3)',
        }}>
          <span style={{
            fontSize: 'var(--font-3xl)',
            fontWeight: 700,
            color: stockIsLow ? 'var(--danger-600)' : 'var(--text-primary)',
          }}>
            {product.stockBase}
          </span>
          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
            unidades base
          </span>
          {stockIsLow && (
            <span className="badge badge-danger" style={{ marginLeft: 'var(--sp-2)' }}>
              Abaixo do minimo
            </span>
          )}
        </div>

        {product.units.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-2)' }}>
            {product.units.map((unit) => {
              const equivalentQty = Math.floor(product.stockBase / unit.factorToBase)
              return (
                <span key={unit.id} style={{
                  padding: 'var(--sp-1) var(--sp-3)',
                  backgroundColor: 'var(--neutral-100)',
                  borderRadius: 'var(--radius-full)',
                  fontSize: 'var(--font-sm)',
                  color: 'var(--neutral-700)',
                }}>
                  {equivalentQty} {unit.nameLabel}{equivalentQty !== 1 ? 's' : ''}
                </span>
              )
            })}
          </div>
        )}
      </div>

      {/* Precos */}
      {product.prices.length > 0 && (
        <div style={sectionStyle}>
          <span style={sectionTitleStyle}>Precos</span>
          {product.prices.map((price) => (
            <div key={price.id} style={rowStyle}>
              <span style={labelStyle}>
                {price.unitName} - {price.tierName}
              </span>
              <span style={{ ...valueStyle, color: 'var(--primary)' }}>
                {formatBRL(price.price)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Movimentacoes Recentes */}
      {product.recentMovements.length > 0 && (
        <div style={sectionStyle}>
          <span style={sectionTitleStyle}>Movimentacoes Recentes</span>
          {product.recentMovements.map((mov) => (
            <div key={mov.id} style={{
              ...rowStyle,
              borderBottom: '1px solid var(--border)',
              paddingBottom: 'var(--sp-2)',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: mov.direction === 'IN' ? 'var(--success-100)' : 'var(--danger-100)',
                    color: mov.direction === 'IN' ? 'var(--success-700)' : 'var(--danger-700)',
                  }}>
                    {mov.direction === 'IN' ? '+' : '-'}
                  </span>
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {mov.qtyBase} un
                  </span>
                </div>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginLeft: '36px', display: 'block', marginTop: '2px' }}>
                  {mov.reasonType.replace(/_/g, ' ').toLowerCase()}
                </span>
              </div>
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                {formatDate(mov.date)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Acoes */}
      <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
        <button
          className="btn btn-primary btn-block"
          onClick={() => navigate(`/produtos/${id}/editar`)}
        >
          Editar
        </button>
        <button
          className="btn btn-secondary btn-block"
          onClick={() => navigate('/estoque')}
        >
          Ver Estoque
        </button>
      </div>
    </div>
  )
}
