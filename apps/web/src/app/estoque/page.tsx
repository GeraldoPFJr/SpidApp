'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/Layout'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useApi } from '@/hooks/useApi'

interface ApiStockRow {
  productId: string
  productName: string
  qtyBase: number
  minStock: number | null
  belowMin: boolean
  units: Array<{ unitId: string; nameLabel: string; factorToBase: number; available: number }>
  costValue: number
  saleValue: number
}

interface StockRow {
  id: string
  productName: string
  stockBase: number
  minStock: number | null
  units: Array<{ label: string; factor: number; equivalent: number }>
  costValue: number
  saleValue: number
}

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function mapStockRow(row: ApiStockRow): StockRow {
  return {
    id: row.productId,
    productName: row.productName,
    stockBase: row.qtyBase ?? 0,
    minStock: row.minStock,
    units: (row.units ?? []).map((u) => ({
      label: u.nameLabel,
      factor: u.factorToBase,
      equivalent: u.available,
    })),
    costValue: row.costValue ?? 0,
    saleValue: row.saleValue ?? 0,
  }
}

export default function EstoquePage() {
  const { data: rawData, loading } = useApi<ApiStockRow[]>('/inventory')
  const data = useMemo(() => (rawData ?? []).map(mapStockRow), [rawData])

  const columns: DataTableColumn<StockRow>[] = useMemo(() => [
    {
      key: 'productName',
      header: 'Produto',
      render: (row) => <span style={{ fontWeight: 500, color: 'var(--color-neutral-900)' }}>{row.productName}</span>,
    },
    {
      key: 'stockBase',
      header: 'Saldo Base',
      width: '120px',
      align: 'right',
      render: (row) => <span style={{ fontWeight: 600 }}>{(row.stockBase ?? 0).toLocaleString('pt-BR')}</span>,
    },
    {
      key: 'units',
      header: 'Equivalentes',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {(row.units ?? []).map((u) => (
            <span key={u.label} style={{
              display: 'inline-flex', padding: '2px 8px', fontSize: 'var(--font-xs)',
              backgroundColor: 'var(--color-neutral-100)', borderRadius: 'var(--radius-sm)',
              color: 'var(--color-neutral-600)',
            }}>
              {u.equivalent} {u.label}
            </span>
          ))}
        </div>
      ),
      sortable: false,
    },
    {
      key: 'costValue',
      header: 'Custo Estoque',
      width: '140px',
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: 500, color: 'var(--color-neutral-700)' }}>
          {row.costValue > 0 ? fmtBRL(row.costValue) : '-'}
        </span>
      ),
    },
    {
      key: 'saleValue',
      header: 'Valor Venda',
      width: '140px',
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: 500, color: 'var(--color-success-700)' }}>
          {row.saleValue > 0 ? fmtBRL(row.saleValue) : '-'}
        </span>
      ),
    },
    {
      key: 'minStock',
      header: 'Minimo',
      width: '100px',
      align: 'right',
      render: (row) => <span style={{ color: 'var(--color-neutral-500)' }}>{row.minStock?.toLocaleString('pt-BR') ?? '-'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      sortable: false,
      render: (row) => {
        if (row.minStock == null) return <span style={{ color: 'var(--color-neutral-400)' }}>-</span>
        const isLow = (row.stockBase ?? 0) < row.minStock
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
            fontSize: 'var(--font-xs)', fontWeight: 500, borderRadius: 'var(--radius-full)',
            backgroundColor: isLow ? 'var(--color-danger-100)' : 'var(--color-success-100)',
            color: isLow ? 'var(--color-danger-700)' : 'var(--color-success-700)',
          }}>
            {isLow ? 'Abaixo min.' : 'OK'}
          </span>
        )
      },
    },
  ], [])

  const navLinks = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Link href="/estoque/movimentacoes" style={{
        padding: '8px 16px', fontSize: 'var(--font-sm)', fontWeight: 500,
        color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)', textDecoration: 'none',
      }}>
        Movimentacoes
      </Link>
      <Link href="/estoque/inventario" style={{
        padding: '8px 16px', fontSize: 'var(--font-sm)', fontWeight: 500,
        color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)', textDecoration: 'none',
      }}>
        Inventario
      </Link>
    </div>
  )

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>Estoque</h1>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', margin: '4px 0 0' }}>Visao geral do estoque</p>
        </div>
        <DataTable
          columns={columns}
          rows={data}
          keyExtractor={(row) => row.id}
          loading={loading}
          searchPlaceholder="Buscar produto..."
          searchKeys={['productName']}
          actions={navLinks}
          emptyTitle="Nenhum produto com estoque"
        />
      </div>
    </Layout>
  )
}
