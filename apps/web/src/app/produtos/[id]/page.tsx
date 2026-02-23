'use client'

import { type CSSProperties, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useApi } from '@/hooks/useApi'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatCurrency, formatDate } from '@/lib/format'

interface ProductRawUnit {
  id: string
  nameLabel: string
  factorToBase: number
  isSellable: boolean
  sortOrder: number
}

interface ProductRawPrice {
  id: string
  productId: string
  unitId: string
  tierId: string
  price: number
  unit?: { nameLabel: string } | null
  tier?: { name: string } | null
  unitLabel?: string
  tierName?: string
}

interface ProductRaw {
  id: string
  name: string
  code: string | null
  categoryId: string
  subcategoryId: string | null
  minStock: number | null
  active: boolean
  category?: { name: string } | null
  subcategory?: { name: string } | null
  categoryName?: string
  subcategoryName?: string | null
  stockBase?: number
  units: ProductRawUnit[]
  prices: ProductRawPrice[]
  recentMovements?: Array<{
    id: string
    date: string
    direction: string
    qtyBase: number
    reasonType: string
    notes: string | null
  }>
  salesLast3Months?: Array<{
    month: string
    revenue: number
    qty: number
  }>
}

interface ProductUnit {
  id: string
  nameLabel: string
  factorToBase: number
  isSellable: boolean
  sortOrder: number
  equivalentStock?: number
}

interface ProductPriceMapped {
  id: string
  unitLabel: string
  tierName: string
  price: number
}

interface ProductDetail {
  id: string
  name: string
  code: string | null
  categoryId: string
  categoryName: string
  subcategoryId: string | null
  subcategoryName: string | null
  minStock: number | null
  active: boolean
  stockBase: number
  units: ProductUnit[]
  prices: ProductPriceMapped[]
  recentMovements: Array<{
    id: string
    date: string
    direction: string
    qtyBase: number
    reasonType: string
    notes: string | null
  }>
  salesLast3Months: Array<{
    month: string
    revenue: number
    qty: number
  }>
}

function mapProductDetail(raw: ProductRaw): ProductDetail {
  const stockBase = raw.stockBase ?? 0
  return {
    id: raw.id,
    name: raw.name,
    code: raw.code,
    categoryId: raw.categoryId,
    categoryName: raw.categoryName ?? raw.category?.name ?? '-',
    subcategoryId: raw.subcategoryId,
    subcategoryName: raw.subcategoryName ?? raw.subcategory?.name ?? null,
    minStock: raw.minStock,
    active: raw.active,
    stockBase,
    units: raw.units.map((u) => ({
      ...u,
      equivalentStock: Math.floor(stockBase / u.factorToBase),
    })),
    prices: raw.prices.map((p) => ({
      id: p.id,
      unitLabel: p.unitLabel ?? p.unit?.nameLabel ?? '-',
      tierName: p.tierName ?? p.tier?.name ?? '-',
      price: Number(p.price),
    })),
    recentMovements: raw.recentMovements ?? [],
    salesLast3Months: raw.salesLast3Months ?? [],
  }
}

export default function ProdutoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { isMobile } = useMediaQuery()
  const { data: rawProduct, loading } = useApi<ProductRaw>(`/products/${id}`)
  const product = rawProduct ? mapProductDetail(rawProduct) : null

  const movementColumns: DataTableColumn<ProductDetail['recentMovements'][0]>[] = useMemo(() => [
    {
      key: 'date',
      header: 'Data',
      width: '120px',
      render: (row) => formatDate(row.date),
    },
    {
      key: 'qtyBase',
      header: 'Quantidade',
      width: '120px',
      align: 'right',
      render: (row) => {
        const isOut = row.direction === 'OUT'
        return (
          <span style={{ fontWeight: 500, color: isOut ? 'var(--color-danger-600)' : 'var(--color-success-600)' }}>
            {isOut ? '-' : '+'}{row.qtyBase.toLocaleString('pt-BR')}
          </span>
        )
      },
    },
    {
      key: 'reasonType',
      header: 'Motivo',
      render: (row) => {
        const reasonMap: Record<string, string> = {
          PURCHASE: 'Compra',
          SALE: 'Venda',
          ADJUSTMENT: 'Ajuste',
          RETURN: 'Devolucao',
          INVENTORY_COUNT: 'Inventario',
        }
        return reasonMap[row.reasonType] ?? row.reasonType
      },
    },
    {
      key: 'notes',
      header: 'Observacao',
      render: (row) => (
        <span style={{ color: 'var(--color-neutral-500)' }}>{row.notes ?? '-'}</span>
      ),
    },
  ], [])

  // ─── Styles ─────────────────────────────────────

  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: isMobile ? '16px' : '24px',
    boxShadow: 'var(--shadow-sm)',
  }

  const infoRowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: isMobile ? '16px' : '20px',
  }

  const infoItemStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }

  const infoLabelStyle: CSSProperties = {
    fontSize: 'var(--font-xs)',
    fontWeight: 500,
    color: 'var(--color-neutral-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const infoValueStyle: CSSProperties = {
    fontSize: 'var(--font-base)',
    fontWeight: 500,
    color: 'var(--color-neutral-800)',
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="skeleton" style={{ height: '32px', width: isMobile ? '200px' : '300px' }} />
          <div className="skeleton skeleton-card" style={{ height: '200px' }} />
          <div className="skeleton skeleton-card" style={{ height: '200px' }} />
        </div>
      </Layout>
    )
  }

  if (!product) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-neutral-500)' }}>
          Produto nao encontrado
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px', maxWidth: '1100px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: isMobile ? 'flex-start' : 'center',
          justifyContent: 'space-between',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => router.back()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: isMobile ? '44px' : '36px', height: isMobile ? '44px' : '36px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)',
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 style={{ fontSize: isMobile ? 'var(--font-xl)' : 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>
                {product.name}
              </h1>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
                {product.code ?? 'Sem codigo'} / {product.categoryName}
              </p>
            </div>
          </div>
          <div style={{
            display: 'flex', gap: '8px',
            width: isMobile ? '100%' : 'auto',
          }}>
            <button
              onClick={() => router.push(`/produtos/${id}/editar`)}
              style={{
                padding: isMobile ? '12px 16px' : '8px 16px',
                fontSize: 'var(--font-sm)', fontWeight: 500,
                color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                flex: isMobile ? 1 : 'none',
                textAlign: 'center',
              }}
            >
              Editar
            </button>
            <button
              onClick={() => router.push(`/estoque/movimentacoes?produto=${id}`)}
              style={{
                padding: isMobile ? '12px 16px' : '8px 16px',
                fontSize: 'var(--font-sm)', fontWeight: 600,
                color: 'var(--color-white)', backgroundColor: 'var(--color-primary-600)',
                border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                flex: isMobile ? 1 : 'none',
                textAlign: 'center',
              }}
            >
              Ajustar Estoque
            </button>
          </div>
        </div>

        {/* Info */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 20px' }}>
            Detalhes
          </h2>
          <div style={infoRowStyle}>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>Estoque Base</span>
              <span style={{ ...infoValueStyle, fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 700 }}>
                {product.stockBase.toLocaleString('pt-BR')}
              </span>
            </div>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>Estoque Minimo</span>
              <span style={infoValueStyle}>{product.minStock?.toLocaleString('pt-BR') ?? 'N/A'}</span>
            </div>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>Categoria</span>
              <span style={infoValueStyle}>{product.categoryName}</span>
            </div>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>Subcategoria</span>
              <span style={infoValueStyle}>{product.subcategoryName ?? '-'}</span>
            </div>
            <div style={infoItemStyle}>
              <span style={infoLabelStyle}>Status</span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 10px',
                  fontSize: 'var(--font-xs)',
                  fontWeight: 500,
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: product.active ? 'var(--color-success-100)' : 'var(--color-neutral-100)',
                  color: product.active ? 'var(--color-success-700)' : 'var(--color-neutral-500)',
                  width: 'fit-content',
                }}
              >
                {product.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        </div>

        {/* Stock Equivalents */}
        {product.units.length > 0 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 16px' }}>
              Estoque por Unidade
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '12px',
            }}>
              {product.units.map((unit) => {
                const equivalent = unit.equivalentStock ?? Math.floor(product.stockBase / unit.factorToBase)
                return (
                  <div
                    key={unit.id}
                    style={{
                      padding: isMobile ? '12px' : '16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-neutral-200)',
                      backgroundColor: 'var(--color-neutral-50)',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-neutral-500)', margin: '0 0 4px', textTransform: 'uppercase', fontWeight: 500 }}>
                      {unit.nameLabel}
                    </p>
                    <p style={{ fontSize: isMobile ? '1.125rem' : '1.25rem', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>
                      {equivalent.toLocaleString('pt-BR')}
                    </p>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-neutral-400)', margin: '2px 0 0' }}>
                      1 = {unit.factorToBase} base
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Prices */}
        {product.prices.length > 0 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 16px' }}>
              Tabela de Precos
            </h2>

            {isMobile ? (
              /* Mobile: card list */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {product.prices.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-neutral-200)',
                      backgroundColor: 'var(--color-neutral-50)',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-800)' }}>
                        {p.unitLabel}
                      </span>
                      <span style={{ fontSize: 'var(--font-xs)', color: 'var(--color-neutral-500)', marginLeft: '8px' }}>
                        {p.tierName}
                      </span>
                    </div>
                    <span style={{ fontWeight: 600, fontSize: 'var(--font-sm)', color: 'var(--color-neutral-900)' }}>
                      {formatCurrency(p.price)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              /* Desktop: table */
              <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-sm)' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--color-neutral-500)', backgroundColor: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Unidade
                      </th>
                      <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 500, color: 'var(--color-neutral-500)', backgroundColor: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Tabela
                      </th>
                      <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 500, color: 'var(--color-neutral-500)', backgroundColor: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Preco
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.prices.map((p) => (
                      <tr key={p.id}>
                        <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)' }}>{p.unitLabel}</td>
                        <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)' }}>{p.tierName}</td>
                        <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(p.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Sales Last 3 Months */}
        {product.salesLast3Months && product.salesLast3Months.length > 0 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 16px' }}>
              Vendas nos Ultimos 3 Meses
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '12px',
            }}>
              {product.salesLast3Months.map((m) => (
                <div
                  key={m.month}
                  style={{
                    padding: isMobile ? '12px 16px' : '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-neutral-200)',
                    backgroundColor: 'var(--color-neutral-50)',
                    textAlign: isMobile ? 'left' : 'center',
                    display: isMobile ? 'flex' : 'block',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-neutral-500)', margin: isMobile ? '0' : '0 0 8px', textTransform: 'uppercase', fontWeight: 500 }}>
                      {m.month}
                    </p>
                    {isMobile && (
                      <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-neutral-400)', margin: '2px 0 0' }}>
                        {m.qty.toLocaleString('pt-BR')} un. base
                      </p>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: isMobile ? 'var(--font-base)' : '1.125rem', fontWeight: 700, color: 'var(--color-neutral-900)', margin: isMobile ? '0' : '0 0 4px' }}>
                      {formatCurrency(m.revenue)}
                    </p>
                    {!isMobile && (
                      <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-neutral-400)', margin: 0 }}>
                        {m.qty.toLocaleString('pt-BR')} un. base
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Movements */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: 0 }}>
            Movimentacoes Recentes
          </h2>
          <DataTable
            columns={movementColumns}
            rows={product.recentMovements ?? []}
            keyExtractor={(row) => row.id}
            searchable={false}
            pageSize={10}
            emptyTitle="Nenhuma movimentacao"
            emptyDescription="Este produto ainda nao possui movimentacoes"
          />
        </div>
      </div>
    </Layout>
  )
}
