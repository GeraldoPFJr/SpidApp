'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useApi } from '@/hooks/useApi'
import { formatCurrency, formatDate } from '@/lib/format'

interface SaleRow {
  id: string
  date: string
  customerName: string | null
  total: number
  status: string
  couponNumber: number | null
}

export default function VendasPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState('')
  const { data, loading } = useApi<SaleRow[]>('/sales')

  const filtered = useMemo(() => {
    if (!data) return []
    if (!statusFilter) return data
    return data.filter((s) => s.status === statusFilter)
  }, [data, statusFilter])

  const columns: DataTableColumn<SaleRow>[] = useMemo(() => [
    {
      key: 'couponNumber',
      header: 'Cupom',
      width: '80px',
      render: (row) => (
        <span style={{ fontWeight: 500, color: 'var(--color-neutral-600)' }}>
          #{String(row.couponNumber ?? 0).padStart(4, '0')}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Data',
      width: '120px',
      render: (row) => formatDate(row.date),
    },
    {
      key: 'customerName',
      header: 'Cliente',
      render: (row) => row.customerName ?? 'Consumidor Final',
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      width: '140px',
      render: (row) => <span style={{ fontWeight: 600 }}>{formatCurrency(row.total)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '130px',
      render: (row) => {
        const map: Record<string, { label: string; bg: string; color: string }> = {
          CONFIRMED: { label: 'Confirmada', bg: 'var(--color-success-100)', color: 'var(--color-success-700)' },
          DRAFT: { label: 'Rascunho', bg: 'var(--color-warning-100)', color: 'var(--color-warning-700)' },
          CANCELLED: { label: 'Cancelada', bg: 'var(--color-danger-100)', color: 'var(--color-danger-700)' },
        }
        const s = map[row.status] ?? map.CONFIRMED
        return (
          <span style={{
            display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
            fontSize: 'var(--font-xs)', fontWeight: 500, borderRadius: 'var(--radius-full)',
            backgroundColor: s.bg, color: s.color,
          }}>
            {s.label}
          </span>
        )
      },
    },
  ], [])

  const filterActions = (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        style={{
          padding: '6px 10px', fontSize: 'var(--font-sm)', color: 'var(--color-neutral-700)',
          backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)',
          borderRadius: 'var(--radius-sm)', outline: 'none', cursor: 'pointer',
        }}
      >
        <option value="">Todos os status</option>
        <option value="CONFIRMED">Confirmadas</option>
        <option value="DRAFT">Rascunhos</option>
        <option value="CANCELLED">Canceladas</option>
      </select>
      <button
        onClick={() => router.push('/vendas/nova')}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '8px 16px', fontSize: 'var(--font-sm)', fontWeight: 600,
          color: 'var(--color-white)', backgroundColor: 'var(--color-primary-600)',
          border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Nova Venda
      </button>
    </div>
  )

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>Vendas</h1>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', margin: '4px 0 0' }}>Historico de vendas</p>
        </div>
        <DataTable
          columns={columns}
          rows={filtered}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => router.push(`/vendas/${row.id}`)}
          loading={loading}
          searchPlaceholder="Buscar por cliente ou cupom..."
          searchKeys={['customerName', 'couponNumber']}
          actions={filterActions}
          emptyTitle="Nenhuma venda encontrada"
          emptyDescription="Crie sua primeira venda"
        />
      </div>
    </Layout>
  )
}
