'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useApi } from '@/hooks/useApi'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatCurrency } from '@/lib/format'
import type { Customer } from '@xpid/shared'

interface CustomerRow extends Customer {
  openAmount?: number
  hasOverdue?: boolean
}

export default function ClientesPage() {
  const router = useRouter()
  const { isMobile } = useMediaQuery()
  const { data, loading } = useApi<CustomerRow[]>('/customers')

  const columns: DataTableColumn<CustomerRow>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Nome',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 500, color: 'var(--color-neutral-900)' }}>{row.name}</span>
          {row.hasOverdue && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', padding: '1px 8px',
              fontSize: 'var(--font-xs)', fontWeight: 500, borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--color-danger-100)', color: 'var(--color-danger-700)',
            }}>
              Inadimplente
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Telefone',
      width: '150px',
      render: (row) => (
        <span style={{ color: 'var(--color-neutral-600)' }}>{row.phone ?? '-'}</span>
      ),
    },
    {
      key: 'doc',
      header: 'Documento',
      width: '160px',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-xs)', color: 'var(--color-neutral-500)' }}>
          {row.doc ?? '-'}
        </span>
      ),
    },
    {
      key: 'openAmount',
      header: 'Em Aberto',
      width: '140px',
      align: 'right',
      render: (row) => {
        const amount = row.openAmount ?? 0
        return (
          <span style={{
            fontWeight: amount > 0 ? 600 : 400,
            color: amount > 0 ? 'var(--color-danger-600)' : 'var(--color-neutral-400)',
          }}>
            {amount > 0 ? formatCurrency(amount) : '-'}
          </span>
        )
      },
    },
    {
      key: 'active',
      header: 'Status',
      width: '100px',
      sortable: false,
      render: (row) => (
        <span style={{
          display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
          fontSize: 'var(--font-xs)', fontWeight: 500, borderRadius: 'var(--radius-full)',
          backgroundColor: !row.deletedAt ? 'var(--color-success-100)' : 'var(--color-neutral-100)',
          color: !row.deletedAt ? 'var(--color-success-700)' : 'var(--color-neutral-500)',
        }}>
          {!row.deletedAt ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
  ], [])

  const newButton = (
    <button
      onClick={() => router.push('/clientes/novo')}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        padding: isMobile ? '12px 16px' : '8px 16px',
        fontSize: 'var(--font-sm)', fontWeight: 600,
        color: 'var(--color-white)', backgroundColor: 'var(--color-primary-600)',
        border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        width: isMobile ? '100%' : 'auto',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary-700)' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary-600)' }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      Novo Cliente
    </button>
  )

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 'var(--font-xl)' : 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>Clientes</h1>
        </div>
        <DataTable
          columns={columns}
          rows={data ?? []}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => router.push(`/clientes/${row.id}`)}
          loading={loading}
          searchPlaceholder="Buscar por nome ou telefone..."
          searchKeys={['name', 'phone', 'doc']}
          actions={newButton}
          emptyTitle="Nenhum cliente cadastrado"
          emptyDescription="Comece cadastrando seu primeiro cliente"
        />
      </div>
    </Layout>
  )
}
