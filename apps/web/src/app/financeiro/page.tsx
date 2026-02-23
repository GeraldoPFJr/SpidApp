'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Layout } from '@/components/Layout'
import { StatsCard } from '@/components/StatsCard'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useApi } from '@/hooks/useApi'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { formatCurrency, formatDate } from '@/lib/format'
import type { FinanceEntry, Account } from '@spid/shared'

interface FinanceOverview {
  accounts: Array<Account & { balance: number }>
  entries: Array<FinanceEntry & { categoryName: string; accountName: string }>
}

export default function FinanceiroPage() {
  const { isMobile } = useMediaQuery()
  const { data, loading } = useApi<FinanceOverview>('/finance')
  const [typeFilter, setTypeFilter] = useState('')
  const [accountFilter, setAccountFilter] = useState('')

  const filteredEntries = useMemo(() => {
    if (!data?.entries) return []
    return data.entries.filter((e) => {
      if (typeFilter && e.type !== typeFilter) return false
      if (accountFilter && e.accountId !== accountFilter) return false
      return true
    })
  }, [data, typeFilter, accountFilter])

  const columns: DataTableColumn<FinanceOverview['entries'][0]>[] = useMemo(() => [
    { key: 'dueDate', header: 'Data', width: '120px', render: (row) => formatDate(row.dueDate ?? row.createdAt) },
    {
      key: 'type', header: 'Tipo', width: '120px',
      render: (row) => {
        const map: Record<string, { label: string; bg: string; color: string }> = {
          EXPENSE: { label: 'Despesa', bg: 'var(--color-danger-100)', color: 'var(--color-danger-700)' },
          INCOME: { label: 'Receita', bg: 'var(--color-success-100)', color: 'var(--color-success-700)' },
          APORTE: { label: 'Aporte', bg: 'var(--color-primary-100)', color: 'var(--color-primary-700)' },
          RETIRADA: { label: 'Retirada', bg: 'var(--color-warning-100)', color: 'var(--color-warning-700)' },
          TRANSFER: { label: 'Transf.', bg: 'var(--color-neutral-100)', color: 'var(--color-neutral-700)' },
        }
        const s = map[row.type] ?? { label: 'Despesa', bg: 'var(--color-danger-100)', color: 'var(--color-danger-700)' }
        return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', fontSize: 'var(--font-xs)', fontWeight: 500, borderRadius: 'var(--radius-full)', backgroundColor: s.bg, color: s.color }}>{s.label}</span>
      },
    },
    { key: 'categoryName', header: 'Categoria', render: (row) => row.categoryName ?? '-' },
    { key: 'accountName', header: 'Conta', width: '140px' },
    { key: 'amount', header: 'Valor', align: 'right', width: '140px', render: (row) => <span style={{ fontWeight: 600 }}>{formatCurrency(row.amount)}</span> },
    {
      key: 'status', header: 'Status', width: '110px',
      render: (row) => {
        const map: Record<string, { label: string; bg: string; color: string }> = {
          SCHEDULED: { label: 'Agendado', bg: 'var(--color-primary-100)', color: 'var(--color-primary-700)' },
          DUE: { label: 'Vencido', bg: 'var(--color-danger-100)', color: 'var(--color-danger-700)' },
          PAID: { label: 'Pago', bg: 'var(--color-success-100)', color: 'var(--color-success-700)' },
          CANCELLED: { label: 'Cancelado', bg: 'var(--color-neutral-100)', color: 'var(--color-neutral-500)' },
        }
        const s = map[row.status] ?? { label: 'Agendado', bg: 'var(--color-primary-100)', color: 'var(--color-primary-700)' }
        return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', fontSize: 'var(--font-xs)', fontWeight: 500, borderRadius: 'var(--radius-full)', backgroundColor: s.bg, color: s.color }}>{s.label}</span>
      },
    },
  ], [])

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>Financeiro</h1>
        </div>

        {/* Account balances */}
        {loading ? (
          <div className="stats-grid">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton skeleton-card" style={{ height: '120px', borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) : (
          <div className="stats-grid">
            {data?.accounts.map((acc) => (
              <StatsCard
                key={acc.id}
                title={acc.name}
                value={formatCurrency(acc.balance)}
                subtitle={acc.type === 'CASH' ? 'Dinheiro' : acc.type === 'BANK' ? 'Banco' : 'Outro'}
              />
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
        }}>
          <Link href="/financeiro/lancamento" style={{
            padding: isMobile ? '12px 16px' : '8px 16px',
            fontSize: 'var(--font-sm)', fontWeight: 600,
            color: 'var(--color-white)', backgroundColor: 'var(--color-primary-600)',
            border: 'none', borderRadius: 'var(--radius-md)',
            textDecoration: 'none', transition: 'all var(--transition-fast)',
            textAlign: 'center', minHeight: '44px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            Lancamento
          </Link>
          <Link href="/financeiro/fechamento" style={{
            padding: isMobile ? '12px 16px' : '8px 16px',
            fontSize: 'var(--font-sm)', fontWeight: 500,
            color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)',
            textDecoration: 'none', transition: 'all var(--transition-fast)',
            textAlign: 'center', minHeight: '44px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            Fechamento
          </Link>
        </div>

        {/* Entries table */}
        <DataTable
          columns={columns}
          rows={filteredEntries}
          keyExtractor={(row) => row.id}
          loading={loading}
          searchPlaceholder="Buscar lancamento..."
          searchKeys={['categoryName', 'notes']}
          actions={
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{
                padding: '6px 10px', fontSize: 'var(--font-sm)', color: 'var(--color-neutral-700)',
                backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)',
                borderRadius: 'var(--radius-sm)', outline: 'none', cursor: 'pointer',
                minHeight: '44px',
              }}>
                <option value="">Todos os tipos</option>
                <option value="EXPENSE">Despesas</option>
                <option value="INCOME">Receitas</option>
                <option value="APORTE">Aportes</option>
                <option value="RETIRADA">Retiradas</option>
              </select>
              <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} style={{
                padding: '6px 10px', fontSize: 'var(--font-sm)', color: 'var(--color-neutral-700)',
                backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)',
                borderRadius: 'var(--radius-sm)', outline: 'none', cursor: 'pointer',
                minHeight: '44px',
              }}>
                <option value="">Todas as contas</option>
                {data?.accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          }
          emptyTitle="Nenhum lancamento"
        />
      </div>
    </Layout>
  )
}
