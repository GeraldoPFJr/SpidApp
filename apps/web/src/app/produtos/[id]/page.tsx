'use client'

import { type CSSProperties, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useApi } from '@/hooks/useApi'
import { formatCurrency, formatDate } from '@/lib/format'
import type { ProductUnit, ProductPrice } from '@spid/shared'

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
  units: (ProductUnit & { equivalentStock?: number })[]
  prices: (ProductPrice & { unitLabel: string; tierName: string })[]
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

export default function ProdutoDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: product, loading } = useApi<ProductDetail>(`/products/${id}`)

  const movementColumns: DataTableColumn<ProductDetail['recentMovements'][0]>[] = useMemo(() => [
    {
      key: 'date',
      header: 'Data',
      width: '120px',
      render: (row) => formatDate(row.date),
    },
    {
      key: 'direction',
      header: 'Direcao',
      width: '100px',
      render: (row) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 10px',
            fontSize: 'var(--font-xs)',
            fontWeight: 500,
            borderRadius: 'var(--radius-full)',
            backgroundColor: row.direction === 'IN' ? 'var(--color-success-100)' : 'var(--color-danger-100)',
            color: row.direction === 'IN' ? 'var(--color-success-700)' : 'var(--color-danger-700)',
          }}
        >
          {row.direction === 'IN' ? 'Entrada' : 'Saida'}
        </span>
      ),
    },
    {
      key: 'qtyBase',
      header: 'Quantidade',
      width: '120px',
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: 500 }}>{row.qtyBase.toLocaleString('pt-BR')}</span>
      ),
    },
    {
      key: 'reasonType',
      header: 'Motivo',
      render: (row) => {
        const reasonMap: Record<string, string> = {
          PURCHASE: 'Compra',
          SALE: 'Venda',
          ADJUSTMENT: 'Ajuste',
          LOSS: 'Perda',
          CONSUMPTION: 'Consumo',
          DONATION: 'Doacao',
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
    padding: '24px',
    boxShadow: 'var(--shadow-sm)',
  }

  const infoRowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '20px',
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
          <div className="skeleton" style={{ height: '32px', width: '300px' }} />
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1100px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => router.back()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)',
                cursor: 'pointer',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>
                {product.name}
              </h1>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
                {product.code ?? 'Sem codigo'} / {product.categoryName}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => router.push(`/produtos/${id}/editar`)}
              style={{
                padding: '8px 16px', fontSize: 'var(--font-sm)', fontWeight: 500,
                color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)',
                border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              Editar
            </button>
            <button
              onClick={() => router.push(`/estoque/movimentacoes?produto=${id}`)}
              style={{
                padding: '8px 16px', fontSize: 'var(--font-sm)', fontWeight: 600,
                color: 'var(--color-white)', backgroundColor: 'var(--color-primary-600)',
                border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
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
              <span style={{ ...infoValueStyle, fontSize: '1.5rem', fontWeight: 700 }}>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
              {product.units.map((unit) => {
                const equivalent = unit.equivalentStock ?? Math.floor(product.stockBase / unit.factorToBase)
                return (
                  <div
                    key={unit.id}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-neutral-200)',
                      backgroundColor: 'var(--color-neutral-50)',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-neutral-500)', margin: '0 0 4px', textTransform: 'uppercase', fontWeight: 500 }}>
                      {unit.nameLabel}
                    </p>
                    <p style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>
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
          </div>
        )}

        {/* Sales Last 3 Months */}
        {product.salesLast3Months && product.salesLast3Months.length > 0 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 16px' }}>
              Vendas nos Ultimos 3 Meses
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {product.salesLast3Months.map((m) => (
                <div
                  key={m.month}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-neutral-200)',
                    backgroundColor: 'var(--color-neutral-50)',
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-neutral-500)', margin: '0 0 8px', textTransform: 'uppercase', fontWeight: 500 }}>
                    {m.month}
                  </p>
                  <p style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-neutral-900)', margin: '0 0 4px' }}>
                    {formatCurrency(m.revenue)}
                  </p>
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-neutral-400)', margin: 0 }}>
                    {m.qty} unidade{m.qty !== 1 ? 's' : ''}
                  </p>
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
