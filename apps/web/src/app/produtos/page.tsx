'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useApi } from '@/hooks/useApi'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { Product } from '@spid/shared'

interface ProductRow extends Product {
  categoryName?: string
  stockBase?: number
}

export default function ProdutosPage() {
  const router = useRouter()
  const { isMobile } = useMediaQuery()
  const { data, loading } = useApi<ProductRow[]>('/products')

  const columns: DataTableColumn<ProductRow>[] = useMemo(() => [
    {
      key: 'name',
      header: 'Nome',
      render: (row) => (
        <span style={{ fontWeight: 500, color: 'var(--color-neutral-900)' }}>
          {row.name}
        </span>
      ),
    },
    {
      key: 'code',
      header: 'Codigo',
      width: '120px',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', color: 'var(--color-neutral-500)', fontSize: 'var(--font-xs)' }}>
          {row.code ?? '-'}
        </span>
      ),
    },
    {
      key: 'categoryName',
      header: 'Categoria',
      width: '160px',
      render: (row) => row.categoryName ?? '-',
    },
    {
      key: 'stockBase',
      header: 'Estoque (base)',
      width: '130px',
      align: 'right',
      render: (row) => (
        <span style={{ fontWeight: 500 }}>
          {row.stockBase != null ? row.stockBase.toLocaleString('pt-BR') : '-'}
        </span>
      ),
    },
    {
      key: 'active',
      header: 'Status',
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
            backgroundColor: row.active ? 'var(--color-success-100)' : 'var(--color-neutral-100)',
            color: row.active ? 'var(--color-success-700)' : 'var(--color-neutral-500)',
          }}
        >
          {row.active ? 'Ativo' : 'Inativo'}
        </span>
      ),
    },
  ], [])

  const newProductButton = (
    <button
      onClick={() => router.push('/produtos/novo')}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: isMobile ? '12px 16px' : '8px 16px',
        fontSize: 'var(--font-sm)',
        fontWeight: 600,
        color: 'var(--color-white)',
        backgroundColor: 'var(--color-primary-600)',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)',
        width: isMobile ? '100%' : 'auto',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary-700)'
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary-600)'
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
      Novo Produto
    </button>
  )

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 'var(--font-xl)' : 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>
            Produtos
          </h1>
        </div>

        <DataTable
          columns={columns}
          rows={data ?? []}
          keyExtractor={(row) => row.id}
          onRowClick={(row) => router.push(`/produtos/${row.id}`)}
          loading={loading}
          searchPlaceholder="Buscar por nome ou codigo..."
          searchKeys={['name', 'code', 'categoryName']}
          actions={newProductButton}
          emptyTitle="Nenhum produto cadastrado"
          emptyDescription="Comece cadastrando seu primeiro produto"
        />
      </div>
    </Layout>
  )
}
