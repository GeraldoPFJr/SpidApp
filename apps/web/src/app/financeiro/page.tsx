'use client'

import { type CSSProperties, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Layout } from '@/components/Layout'
import { StatsCard } from '@/components/StatsCard'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useApi } from '@/hooks/useApi'
import { formatCurrency, formatDate } from '@/lib/format'
import type { FinanceEntry, Account } from '@spid/shared'

interface FinanceOverview {
  accounts: Array<Account & { balance: number }>
  entries: Array<FinanceEntry & { categoryName: string; accountName: string }>
}

export default function FinanceiroPage() {
  const router = useRouter()
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
        const s = map[row.type] ?? map.EXPENSE
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
        const s = map[row.status] ?? map.SCHEDULED
        return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', fontSize: 'var(--font-xs)', fontWeight: 500, borderRadius: 'var(--radius-full)', backgroundColor: s.bg, color: s.color }}>{s.label}</span>
      },
    },
  ], [])

  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)', padding: '20px', boxShadow: 'var(--shadow-sm)',
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>Financeiro</h1>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', margin: '4px 0 0' }}>Visao geral financeira</p>
        </div>

        {/* Account balances */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton skeleton-card" style={{ height: '120px', borderRadius: 'var(--radius-lg)' }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
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
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { label: 'Nova Despesa', href: '/financeiro/lancamento?tipo=EXPENSE' },
            { label: 'Nova Receita', href: '/financeiro/lancamento?tipo=INCOME' },
            { label: 'Aporte', href: '/financeiro/lancamento?tipo=APORTE' },
            { label: 'Retirada', href: '/financeiro/lancamento?tipo=RETIRADA' },
            { label: 'Fechamento', href: '/financeiro/fechamento' },
          ].map((btn) => (
            <Link key={btn.label} href={btn.href} style={{
              padding: '8px 16px', fontSize: 'var(--font-sm)', fontWeight: 500,
              color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)',
              textDecoration: 'none', transition: 'all var(--transition-fast)',
            }}>
              {btn.label}
            </Link>
          ))}
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={{
                padding: '6px 10px', fontSize: 'var(--font-sm)', color: 'var(--color-neutral-700)',
                backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)',
                borderRadius: 'var(--radius-sm)', outline: 'none', cursor: 'pointer',
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
