'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/Layout'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useApi } from '@/hooks/useApi'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useToast } from '@/hooks/useToast'
import { Toast } from '@xpid/ui'

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

function StockMobileCard({ row }: { row: StockRow }) {
  const baseUnit = row.units.find((u) => u.factor === 1) ?? row.units[0]
  const [selectedLabel, setSelectedLabel] = useState(baseUnit?.label ?? null)

  const totalSaleValue = useMemo(() => {
    if (row.stockBase <= 0 || row.saleValue <= 0) return null
    const basePrice = row.saleValue / row.stockBase
    const unit = row.units.find((u) => u.label === selectedLabel)
    if (!unit) return null
    // qty of this unit that fits × price per unit (basePrice × factor)
    return unit.equivalent * (basePrice * unit.factor)
  }, [selectedLabel, row.stockBase, row.saleValue, row.units])

  return (
    <>
      {/* Line 1: Product name + status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
      }}>
        <span style={{
          fontWeight: 600,
          fontSize: 'var(--font-sm)',
          color: 'var(--color-neutral-900)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {row.productName}
        </span>
        {row.minStock != null && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
            fontSize: 'var(--font-xs)', fontWeight: 500, borderRadius: 'var(--radius-full)',
            backgroundColor: row.stockBase < row.minStock ? 'var(--color-danger-100)' : 'var(--color-success-100)',
            color: row.stockBase < row.minStock ? 'var(--color-danger-700)' : 'var(--color-success-700)',
            flexShrink: 0,
          }}>
            {row.stockBase < row.minStock ? 'Abaixo min.' : 'OK'}
          </span>
        )}
      </div>

      {/* Line 2: Qty + Cost total + Sale per unit */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: 'var(--font-xs)',
      }}>
        <span style={{ fontWeight: 600, color: 'var(--color-neutral-900)' }}>
          {row.stockBase.toLocaleString('pt-BR')}
        </span>
        <span style={{ color: 'var(--color-neutral-500)' }}>
          Custo {row.costValue > 0 ? fmtBRL(row.costValue) : '-'}
        </span>
        <span style={{ color: 'var(--color-success-700)', fontWeight: 500 }}>
          Venda {totalSaleValue != null ? fmtBRL(totalSaleValue) : '-'}
        </span>
      </div>

      {/* Line 3: Clickable unit badges */}
      {row.units.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {row.units.map((u) => {
            const isSelected = u.label === selectedLabel
            return (
              <span
                key={u.label}
                onClick={(e) => { e.stopPropagation(); setSelectedLabel(u.label) }}
                style={{
                  display: 'inline-flex', padding: '2px 8px', fontSize: 'var(--font-xs)',
                  backgroundColor: isSelected ? 'var(--color-primary-100)' : 'var(--color-neutral-100)',
                  borderRadius: 'var(--radius-sm)',
                  color: isSelected ? 'var(--color-primary-700)' : 'var(--color-neutral-600)',
                  fontWeight: isSelected ? 500 : 400,
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {u.equivalent} {u.label}
              </span>
            )
          })}
        </div>
      )}
    </>
  )
}

export default function EstoquePage() {
  const { isMobile } = useMediaQuery()
  const { data: rawData, loading } = useApi<ApiStockRow[]>('/inventory')
  const data = useMemo(() => (rawData ?? []).map(mapStockRow), [rawData])
  const { toastProps } = useToast()

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
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Link href="/estoque/movimentacoes" style={{
        padding: isMobile ? '10px 14px' : '8px 16px',
        fontSize: 'var(--font-sm)', fontWeight: 500,
        color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)', textDecoration: 'none',
        minHeight: '44px', display: 'inline-flex', alignItems: 'center',
      }}>
        Movimentacoes
      </Link>
      <Link href="/estoque/inventario" style={{
        padding: isMobile ? '10px 14px' : '8px 16px',
        fontSize: 'var(--font-sm)', fontWeight: 500,
        color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)',
        border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)', textDecoration: 'none',
        minHeight: '44px', display: 'inline-flex', alignItems: 'center',
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
          renderMobileCard={(row) => <StockMobileCard row={row} />}
        />
      </div>
      <Toast {...toastProps} />
    </Layout>
  )
}
