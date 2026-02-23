'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useApi } from '@/hooks/useApi'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatCurrency, formatDate } from '@/lib/format'

interface PurchaseRaw {
  id: string
  date: string
  status: string
  supplier?: { name: string } | null
  supplierName?: string
  items?: Array<{ totalCost?: number }> | null
  costs?: Array<{ amount?: number }> | null
  total?: number
  itemCount?: number
}

interface PurchaseRow {
  id: string
  date: string
  supplierName: string
  total: number
  itemCount: number
  status: string
}

function mapPurchaseRow(raw: PurchaseRaw): PurchaseRow {
  const itemsTotal = raw.items?.reduce((sum, i) => sum + Number(i.totalCost ?? 0), 0) ?? 0
  const costsTotal = raw.costs?.reduce((sum, c) => sum + Number(c.amount ?? 0), 0) ?? 0
  return {
    id: raw.id,
    date: raw.date,
    supplierName: raw.supplierName ?? raw.supplier?.name ?? 'Sem fornecedor',
    total: raw.total != null ? Number(raw.total) : itemsTotal + costsTotal,
    itemCount: raw.itemCount ?? raw.items?.length ?? 0,
    status: raw.status,
  }
}

export default function ComprasPage() {
  const router = useRouter()
  const { isMobile } = useMediaQuery()
  const { data: rawData, loading } = useApi<PurchaseRaw[]>('/purchases')
  const data = useMemo(() => rawData?.map(mapPurchaseRow) ?? [], [rawData])

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
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? '12px' : '16px',
        }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>Compras</h1>
          </div>
          <button onClick={() => router.push('/compras/nova')} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: isMobile ? '12px 16px' : '8px 16px',
            fontSize: 'var(--font-sm)', fontWeight: 600,
            color: 'var(--color-white)', backgroundColor: 'var(--color-primary-600)',
            border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            width: isMobile ? '100%' : 'auto',
            minHeight: '44px',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Nova Compra
          </button>
        </div>
        <DataTable
          columns={columns}
          rows={data}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => router.push(`/compras/${row.id}`)}
          loading={loading}
          searchPlaceholder="Buscar por fornecedor..."
          searchKeys={['supplierName']}
          emptyTitle="Nenhuma compra registrada"
          emptyDescription="Registre sua primeira compra"
        />
      </div>
    </Layout>
  )
}
