'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useApi } from '@/hooks/useApi'
import { formatCurrency, formatDate } from '@/lib/format'

interface PurchaseRow {
  id: string
  date: string
  supplierName: string
  total: number
  itemCount: number
  status: string
}

export default function ComprasPage() {
  const router = useRouter()
  const { data, loading } = useApi<PurchaseRow[]>('/purchases')

  const columns: DataTableColumn<PurchaseRow>[] = useMemo(() => [
    { key: 'date', header: 'Data', width: '120px', render: (row) => formatDate(row.date) },
    { key: 'supplierName', header: 'Fornecedor', render: (row) => <span style={{ fontWeight: 500, color: 'var(--color-neutral-900)' }}>{row.supplierName}</span> },
    { key: 'total', header: 'Total', align: 'right', width: '140px', render: (row) => <span style={{ fontWeight: 600 }}>{formatCurrency(row.total)}</span> },
    { key: 'itemCount', header: 'Itens', width: '80px', align: 'center', render: (row) => String(row.itemCount) },
    {
      key: 'status', header: 'Status', width: '120px',
      render: (row) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', fontSize: 'var(--font-xs)', fontWeight: 500, borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-success-100)', color: 'var(--color-success-700)' }}>
          {row.status === 'CONFIRMED' ? 'Confirmada' : row.status}
        </span>
      ),
    },
  ], [])

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>Compras</h1>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', margin: '4px 0 0' }}>Entradas de estoque via compras</p>
        </div>
        <DataTable
          columns={columns}
          rows={data ?? []}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => router.push(`/compras/${row.id}`)}
          loading={loading}
          searchPlaceholder="Buscar por fornecedor..."
          searchKeys={['supplierName']}
          actions={
            <button onClick={() => router.push('/compras/nova')} style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', fontSize: 'var(--font-sm)', fontWeight: 600,
              color: 'var(--color-white)', backgroundColor: 'var(--color-primary-600)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Nova Compra
            </button>
          }
          emptyTitle="Nenhuma compra registrada"
          emptyDescription="Registre sua primeira compra"
        />
      </div>
    </Layout>
  )
}
