'use client'

import { type CSSProperties, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { StatsCard } from '@/components/StatsCard'
import { useApi } from '@/hooks/useApi'
import { formatCurrency, formatDate } from '@/lib/format'

interface CustomerDetail {
  id: string
  name: string
  phone: string | null
  doc: string | null
  address: string | null
  notes: string | null
  openAmount: number
  pendingCount: number
  lastPurchaseDate: string | null
  sales: Array<{
    id: string
    date: string
    total: number
    status: string
    couponNumber: number | null
  }>
  receivables: Array<{
    id: string
    saleId: string | null
    dueDate: string
    amount: number
    status: string
    kind: string
  }>
}

export default function ClienteDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: customer, loading } = useApi<CustomerDetail>(`/customers/${id}`)

  const saleColumns: DataTableColumn<CustomerDetail['sales'][0]>[] = useMemo(() => [
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
      key: 'total',
      header: 'Total',
      align: 'right',
      width: '140px',
      render: (row) => <span style={{ fontWeight: 600 }}>{formatCurrency(row.total)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
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

  const receivableColumns: DataTableColumn<CustomerDetail['receivables'][0]>[] = useMemo(() => [
    {
      key: 'dueDate',
      header: 'Vencimento',
      width: '120px',
      render: (row) => {
        const isOverdue = row.status === 'OPEN' && new Date(row.dueDate) < new Date()
        return (
          <span style={{ color: isOverdue ? 'var(--color-danger-600)' : 'var(--color-neutral-800)', fontWeight: isOverdue ? 600 : 400 }}>
            {formatDate(row.dueDate)}
          </span>
        )
      },
    },
    {
      key: 'kind',
      header: 'Tipo',
      width: '120px',
      render: (row) => {
        const kindMap: Record<string, string> = {
          CREDIARIO: 'Crediario', BOLETO: 'Boleto', CHEQUE: 'Cheque', CARD_INSTALLMENT: 'Cartao',
        }
        return kindMap[row.kind] ?? row.kind
      },
    },
    {
      key: 'amount',
      header: 'Valor',
      align: 'right',
      width: '140px',
      render: (row) => <span style={{ fontWeight: 600 }}>{formatCurrency(row.amount)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      width: '100px',
      render: (row) => {
        const map: Record<string, { label: string; bg: string; color: string }> = {
          OPEN: { label: 'Aberto', bg: 'var(--color-warning-100)', color: 'var(--color-warning-700)' },
          PAID: { label: 'Pago', bg: 'var(--color-success-100)', color: 'var(--color-success-700)' },
          CANCELLED: { label: 'Cancelado', bg: 'var(--color-neutral-100)', color: 'var(--color-neutral-500)' },
        }
        const s = map[row.status] ?? map.OPEN
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
    {
      key: 'actions',
      header: '',
      width: '90px',
      sortable: false,
      render: (row) =>
        row.status === 'OPEN' ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              // TODO: open receive modal
            }}
            style={{
              padding: '4px 12px', fontSize: 'var(--font-xs)', fontWeight: 600,
              color: 'var(--color-primary-600)', backgroundColor: 'var(--color-primary-50)',
              border: '1px solid var(--color-primary-200)', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            Receber
          </button>
        ) : null,
    },
  ], [])

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

  const infoLabelStyle: CSSProperties = {
    fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)',
    textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px',
  }

  const infoValueStyle: CSSProperties = {
    fontSize: 'var(--font-base)', fontWeight: 500, color: 'var(--color-neutral-800)', margin: 0,
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="skeleton" style={{ height: '32px', width: '300px' }} />
          <div className="skeleton skeleton-card" style={{ height: '150px' }} />
          <div className="skeleton skeleton-card" style={{ height: '200px' }} />
        </div>
      </Layout>
    )
  }

  if (!customer) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-neutral-500)' }}>
          Cliente nao encontrado
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
            <button onClick={() => router.back()} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)', cursor: 'pointer',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>
              {customer.name}
            </h1>
          </div>
          <button
            onClick={() => router.push(`/vendas/nova?cliente=${id}`)}
            style={{
              padding: '8px 16px', fontSize: 'var(--font-sm)', fontWeight: 600,
              color: 'var(--color-white)', backgroundColor: 'var(--color-primary-600)',
              border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: '8px',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nova Venda
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          <StatsCard
            title="Em Aberto"
            value={formatCurrency(customer.openAmount)}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            }
          />
          <StatsCard
            title="Parcelas Pendentes"
            value={String(customer.pendingCount)}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            }
          />
          <StatsCard
            title="Ultima Compra"
            value={customer.lastPurchaseDate ? formatDate(customer.lastPurchaseDate) : 'Nunca'}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
          />
        </div>

        {/* Info */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 20px' }}>Dados Cadastrais</h2>
          <div style={infoRowStyle}>
            <div>
              <p style={infoLabelStyle}>Telefone</p>
              <p style={infoValueStyle}>{customer.phone ?? '-'}</p>
            </div>
            <div>
              <p style={infoLabelStyle}>Documento</p>
              <p style={infoValueStyle}>{customer.doc ?? '-'}</p>
            </div>
            <div>
              <p style={infoLabelStyle}>Endereco</p>
              <p style={infoValueStyle}>{customer.address ?? '-'}</p>
            </div>
          </div>
          {customer.notes && (
            <div style={{ marginTop: '16px' }}>
              <p style={infoLabelStyle}>Observacoes</p>
              <p style={{ ...infoValueStyle, color: 'var(--color-neutral-600)' }}>{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Sales History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: 0 }}>Historico de Vendas</h2>
          <DataTable
            columns={saleColumns}
            rows={customer.sales ?? []}
            keyExtractor={(row) => row.id}
            onRowClick={(row) => router.push(`/vendas/${row.id}`)}
            searchable={false}
            pageSize={10}
            emptyTitle="Nenhuma venda"
            emptyDescription="Este cliente ainda nao possui vendas"
          />
        </div>

        {/* Receivables */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: 0 }}>Recebiveis Pendentes</h2>
          <DataTable
            columns={receivableColumns}
            rows={customer.receivables?.filter((r) => r.status === 'OPEN') ?? []}
            keyExtractor={(row) => row.id}
            searchable={false}
            pageSize={10}
            emptyTitle="Nenhum recebivel pendente"
            emptyDescription="Este cliente esta em dia"
          />
        </div>
      </div>
    </Layout>
  )
}
