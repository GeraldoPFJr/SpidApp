'use client'

import { type CSSProperties, useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { StatsCard } from '@/components/StatsCard'
import { OverdueAlert } from '@/components/OverdueAlert'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useApi } from '@/hooks/useApi'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatCurrency, formatDate, getCurrentMonth } from '@/lib/format'

// ─── Types ──────────────────────────────────────────────

interface DashboardData {
  revenue: number
  grossProfit: number
  netProfit: number
  salesCount: number
  averageTicket: number
  received: number
  toReceive: number
  expenses: number
  revenueChange?: number
  grossProfitChange?: number
  netProfitChange?: number
  salesCountChange?: number
  recentSales: Array<{
    id: string
    date: string
    customerName: string | null
    total: number
    status: string
    paymentStatus: string
    couponNumber: number | null
  }>
  overdueCount: number
  overdueTotal: number
}

// ─── Component ──────────────────────────────────────────

export default function DashboardPage() {
  const [month, setMonth] = useState(getCurrentMonth)
  const router = useRouter()
  const { isMobile } = useMediaQuery()
  const { data, loading } = useApi<DashboardData>(`/reports/dashboard?month=${month}`)

  const handleMonthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setMonth(e.target.value)
  }, [])

  const saleColumns: DataTableColumn<DashboardData['recentSales'][0]>[] = useMemo(() => [
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
      render: (row) => (
        <span style={{ fontWeight: 600 }}>{formatCurrency(row.total)}</span>
      ),
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      width: '120px',
      render: (row) => {
        const statusMap: Record<string, { label: string; bg: string; color: string }> = {
          PAID: { label: 'Paga', bg: 'var(--color-success-100)', color: 'var(--color-success-700)' },
          OPEN: { label: 'Em Aberto', bg: 'var(--color-primary-100)', color: 'var(--color-primary-700)' },
          OVERDUE: { label: 'Vencida', bg: 'var(--color-danger-100)', color: 'var(--color-danger-700)' },
          DRAFT: { label: 'Rascunho', bg: 'var(--color-warning-100)', color: 'var(--color-warning-700)' },
          CANCELLED: { label: 'Cancelada', bg: 'var(--color-neutral-100)', color: 'var(--color-neutral-500)' },
        }
        const s = statusMap[row.paymentStatus] ?? { label: 'Paga', bg: 'var(--color-success-100)', color: 'var(--color-success-700)' }
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 10px',
              fontSize: 'var(--font-xs)',
              fontWeight: 500,
              borderRadius: 'var(--radius-full)',
              backgroundColor: s.bg,
              color: s.color,
            }}
          >
            {s.label}
          </span>
        )
      },
    },
  ], [])

  // ─── Styles ────────────────────────────────────────

  const pageStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: isMobile ? '16px' : '24px',
  }

  const headerRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: isMobile ? 'stretch' : 'center',
    justifyContent: 'space-between',
    flexDirection: isMobile ? 'column' : 'row',
    flexWrap: 'wrap',
    gap: isMobile ? '12px' : '16px',
  }

  const headerLeftStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  }

  const pageTitleStyle: CSSProperties = {
    fontSize: isMobile ? 'var(--font-xl)' : 'var(--font-2xl)',
    fontWeight: 700,
    color: 'var(--color-neutral-900)',
    margin: 0,
  }

  const headerActionsStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }

  const monthInputStyle: CSSProperties = {
    padding: isMobile ? '10px 12px' : '8px 12px',
    fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-700)',
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-neutral-300)',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    cursor: 'pointer',
    flex: isMobile ? 1 : undefined,
    minWidth: 0,
  }

  const newSaleButtonStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: isMobile ? '10px 16px' : '10px 20px',
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
    color: 'var(--color-white)',
    backgroundColor: 'var(--color-primary-600)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    whiteSpace: 'nowrap',
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: 'var(--font-lg)',
    fontWeight: 600,
    color: 'var(--color-neutral-800)',
    margin: 0,
  }

  // ─── Render ───────────────────────────────────────

  const revenue = data?.revenue ?? 0
  const grossProfit = data?.grossProfit ?? 0
  const netProfit = data?.netProfit ?? 0
  const salesCount = data?.salesCount ?? 0
  const averageTicket = data?.averageTicket ?? 0
  const received = data?.received ?? 0
  const toReceive = data?.toReceive ?? 0
  const expenses = data?.expenses ?? 0

  return (
    <Layout>
      <div style={pageStyle}>
        {/* Header */}
        <div style={headerRowStyle}>
          <div style={headerLeftStyle}>
            <h1 style={pageTitleStyle}>Dashboard</h1>
          </div>
          <div style={headerActionsStyle}>
            <input
              type="month"
              value={month}
              onChange={handleMonthChange}
              style={monthInputStyle}
            />
            <button
              style={newSaleButtonStyle}
              onClick={() => router.push('/vendas/nova')}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary-700)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-primary-600)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Nova Venda
            </button>
          </div>
        </div>

        {/* Overdue Alert */}
        {data && <OverdueAlert count={data.overdueCount} total={data.overdueTotal} />}

        {/* Stats Grid */}
        {loading ? (
          <div className="stats-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton skeleton-card" style={{ height: '140px', borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : (
          <>
            <div className="stats-grid">
              <StatsCard
                title="Faturamento"
                value={formatCurrency(revenue)}
                change={data?.revenueChange != null ? { value: data.revenueChange } : undefined}
                subtitle="vs mes anterior"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                }
              />
              <StatsCard
                title="Lucro Bruto"
                value={formatCurrency(grossProfit)}
                change={data?.grossProfitChange != null ? { value: data.grossProfitChange } : undefined}
                tooltip="Lucro Bruto = Faturamento - Custo dos Produtos Vendidos (COGS)"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                    <polyline points="17 6 23 6 23 12" />
                  </svg>
                }
              />
              <StatsCard
                title="Lucro Liquido"
                value={formatCurrency(netProfit)}
                change={data?.netProfitChange != null ? { value: data.netProfitChange } : undefined}
                tooltip="Lucro Liquido = Receitas - Custo dos Produtos - Rateio das Despesas (proporcional ao faturamento)"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                }
              />
              <StatsCard
                title="Qtd Vendas"
                value={String(salesCount)}
                change={data?.salesCountChange != null ? { value: data.salesCountChange } : undefined}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                }
              />
            </div>
            <div className="stats-grid">
              <StatsCard
                title="Ticket Medio"
                value={formatCurrency(averageTicket)}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                    <rect x="9" y="3" width="6" height="4" rx="1" />
                  </svg>
                }
              />
              <StatsCard
                title="Recebido"
                value={formatCurrency(received)}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                }
              />
              <StatsCard
                title="A Receber"
                value={formatCurrency(toReceive)}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                }
              />
              <StatsCard
                title="Despesas"
                value={formatCurrency(expenses)}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                }
              />
            </div>
          </>
        )}

        {/* Recent Sales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={sectionTitleStyle}>Ultimas Vendas</h2>
            <Link
              href="/vendas"
              style={{
                fontSize: 'var(--font-sm)',
                fontWeight: 500,
                color: 'var(--color-primary-600)',
                textDecoration: 'none',
              }}
            >
              Ver todas
            </Link>
          </div>
          <DataTable
            columns={saleColumns}
            rows={data?.recentSales ?? []}
            keyExtractor={(row) => row.id}
            onRowClick={(row) => router.push(`/vendas/${row.id}`)}
            loading={loading}
            searchable={false}
            pageSize={10}
            emptyTitle="Nenhuma venda neste periodo"
            emptyDescription="Crie sua primeira venda clicando em Nova Venda"
          />
        </div>
      </div>
    </Layout>
  )
}
