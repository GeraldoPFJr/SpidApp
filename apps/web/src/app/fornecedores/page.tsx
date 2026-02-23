'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useApi } from '@/hooks/useApi'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { Supplier } from '@xpid/shared'

export default function FornecedoresPage() {
  const router = useRouter()
  const { isMobile } = useMediaQuery()
  const { data, loading } = useApi<Supplier[]>('/suppliers')

  const columns: DataTableColumn<Supplier>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Nome',
      render: (row) => (
        <span style={{ fontWeight: 500, color: 'var(--color-neutral-900)' }}>{row.name}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Telefone',
      width: '150px',
      render: (row) => <span style={{ color: 'var(--color-neutral-600)' }}>{row.phone ?? '-'}</span>,
    },
    {
      key: 'cnpj',
      header: 'CNPJ',
      width: '170px',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontSize: 'var(--font-xs)', color: 'var(--color-neutral-500)' }}>
          {row.cnpj ?? '-'}
        </span>
      ),
    },
    {
      key: 'city',
      header: 'Cidade',
      width: '150px',
      render: (row) => row.city ?? '-',
    },
    {
      key: 'productTypes',
      header: 'Tipo Produtos',
      width: '180px',
      render: (row) => (
        <span style={{ color: 'var(--color-neutral-600)', fontSize: 'var(--font-sm)' }}>
          {row.productTypes ?? '-'}
        </span>
      ),
    },
  ], [])

  const newButton = (
    <button
      onClick={() => router.push('/fornecedores/novo')}
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
      Novo Fornecedor
    </button>
  )

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 'var(--font-xl)' : 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>Fornecedores</h1>
        </div>
        <DataTable
          columns={columns}
          rows={data ?? []}
          keyExtractor={(row) => row.id}
          loading={loading}
          searchPlaceholder="Buscar por nome, CNPJ ou cidade..."
          searchKeys={['name', 'cnpj', 'city', 'productTypes']}
          actions={newButton}
          emptyTitle="Nenhum fornecedor cadastrado"
          emptyDescription="Comece cadastrando seu primeiro fornecedor"
        />
      </div>
    </Layout>
  )
}
