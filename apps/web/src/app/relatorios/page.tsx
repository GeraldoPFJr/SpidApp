'use client'

import { type CSSProperties, useMemo, useState } from 'react'
import { Layout } from '@/components/Layout'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useApi } from '@/hooks/useApi'
import { formatCurrency, formatMonth, getCurrentMonth } from '@/lib/format'

// ─── Types ──────────────────────────────────────────────

type Tab = 'products' | 'customers' | 'cashflow'

interface Product3mRow {
  productId: string
  productName: string
  m2Revenue: number
  m2Profit: number
  m1Revenue: number
  m1Profit: number
  m0Revenue: number
  m0Profit: number
  totalRevenue: number
  totalProfit: number
  totalQty: number
}

interface CustomerRankRow {
  customerId: string
  customerName: string
  totalPurchased: number
  totalProfit: number
  salesCount: number
  avgPaymentDays: number
}

interface CashFlowRow {
  categoryName: string
  type: 'IN' | 'OUT'
  amount: number
}

interface CashFlowData {
  accounts: Array<{
    accountId: string
    accountName: string
    openingBalance: number
    totalIn: number
    totalOut: number
    closingBalance: number
  }>
  consolidated: {
    totalIn: number
    totalOut: number
    netFlow: number
  }
  byCategory: CashFlowRow[]
}

// ─── Component ──────────────────────────────────────────

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState<Tab>('products')
  const [month, setMonth] = useState(getCurrentMonth)
  const [viewMode, setViewMode] = useState<'revenue' | 'profit'>('revenue')

  const { data: productsData, loading: productsLoading } = useApi<Product3mRow[]>('/reports/products-3m')
  const { data: customersData, loading: customersLoading } = useApi<CustomerRankRow[]>('/reports/customers-3m')
  const { data: cashFlowData, loading: cashFlowLoading } = useApi<CashFlowData>(`/reports/cashflow?month=${month}`)

  // ─── Month labels ──────────────────────────────

  const monthLabels = useMemo(() => {
    const [y, m] = month.split('-').map(Number)
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const getLabel = (offset: number) => {
      let mm = m - offset
      let yy = y
      if (mm <= 0) { mm += 12; yy -= 1 }
      return `${months[mm - 1]}/${yy}`
    }
    return { m2: getLabel(2), m1: getLabel(1), m0: getLabel(0) }
  }, [month])

  // ─── Products 3 Months columns ─────────────────

  const productColumns: DataTableColumn<Product3mRow>[] = useMemo(() => [
    {
      key: 'productName',
      header: 'Produto',
      render: (row) => <span style={{ fontWeight: 500 }}>{row.productName}</span>,
    },
    {
      key: 'm2',
      header: monthLabels.m2,
      align: 'right',
      width: '130px',
      render: (row) => (
        <span style={{ fontWeight: 500 }}>
          {formatCurrency(viewMode === 'revenue' ? row.m2Revenue : row.m2Profit)}
        </span>
      ),
    },
    {
      key: 'm1',
      header: monthLabels.m1,
      align: 'right',
      width: '130px',
      render: (row) => (
        <span style={{ fontWeight: 500 }}>
          {formatCurrency(viewMode === 'revenue' ? row.m1Revenue : row.m1Profit)}
        </span>
      ),
    },
    {
      key: 'm0',
      header: monthLabels.m0,
      align: 'right',
      width: '130px',
      render: (row) => (
        <span style={{ fontWeight: 600 }}>
          {formatCurrency(viewMode === 'revenue' ? row.m0Revenue : row.m0Profit)}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      width: '140px',
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--color-primary-700)' }}>
          {formatCurrency(viewMode === 'revenue' ? row.totalRevenue : row.totalProfit)}
        </span>
      ),
    },
    {
      key: 'totalQty',
      header: 'Qtd Vendida',
      align: 'right',
      width: '120px',
      render: (row) => <span style={{ color: 'var(--color-neutral-500)' }}>{row.totalQty.toLocaleString('pt-BR')}</span>,
    },
  ], [viewMode, monthLabels])

  // ─── Customer Ranking columns ──────────────────

  const customerColumns: DataTableColumn<CustomerRankRow>[] = useMemo(() => [
    {
      key: 'rank',
      header: '#',
      width: '50px',
      sortable: false,
      render: (_, __, index) => (
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '24px', height: '24px', borderRadius: 'var(--radius-full)',
          backgroundColor: (index ?? 0) < 3 ? 'var(--color-primary-100)' : 'var(--color-neutral-100)',
          color: (index ?? 0) < 3 ? 'var(--color-primary-700)' : 'var(--color-neutral-500)',
          fontSize: 'var(--font-xs)', fontWeight: 700,
        }}>
          {(index ?? 0) + 1}
        </span>
      ),
    },
    {
      key: 'customerName',
      header: 'Cliente',
      render: (row) => <span style={{ fontWeight: 500 }}>{row.customerName}</span>,
    },
    {
      key: 'totalPurchased',
      header: 'Total Comprado',
      align: 'right',
      width: '150px',
      render: (row) => <span style={{ fontWeight: 600 }}>{formatCurrency(row.totalPurchased)}</span>,
    },
    {
      key: 'totalProfit',
      header: 'Lucro',
      align: 'right',
      width: '130px',
      render: (row) => (
        <span style={{ fontWeight: 600, color: row.totalProfit >= 0 ? 'var(--color-success-600)' : 'var(--color-danger-600)' }}>
          {formatCurrency(row.totalProfit)}
        </span>
      ),
    },
    {
      key: 'salesCount',
      header: 'Vendas',
      align: 'center',
      width: '90px',
      render: (row) => <span style={{ fontWeight: 500 }}>{row.salesCount}</span>,
    },
    {
      key: 'avgPaymentDays',
      header: 'Prazo Medio',
      align: 'right',
      width: '130px',
      render: (row) => (
        <span style={{
          fontWeight: 500,
          color: row.avgPaymentDays > 30 ? 'var(--color-danger-600)' : row.avgPaymentDays > 7 ? 'var(--color-warning-600)' : 'var(--color-success-600)',
        }}>
          {row.avgPaymentDays === 0 ? 'A vista' : `${row.avgPaymentDays}d`}
        </span>
      ),
    },
  ], [])

  // ─── Styles ────────────────────────────────────

  const tabBarStyle: CSSProperties = {
    display: 'flex',
    gap: '4px',
    backgroundColor: 'var(--color-neutral-100)',
    borderRadius: 'var(--radius-md)',
    padding: '4px',
  }

  const tabBtnStyle = (active: boolean): CSSProperties => ({
    padding: '8px 20px',
    fontSize: 'var(--font-sm)',
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--color-neutral-900)' : 'var(--color-neutral-500)',
    backgroundColor: active ? 'var(--color-white)' : 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    boxShadow: active ? 'var(--shadow-sm)' : 'none',
  })

  const toggleBtnStyle = (active: boolean): CSSProperties => ({
    padding: '6px 14px',
    fontSize: 'var(--font-xs)',
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--color-primary-700)' : 'var(--color-neutral-500)',
    backgroundColor: active ? 'var(--color-primary-50)' : 'var(--color-white)',
    border: `1px solid ${active ? 'var(--color-primary-300)' : 'var(--color-neutral-300)'}`,
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  })

  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: '20px',
    boxShadow: 'var(--shadow-sm)',
  }

  const accountCardStyle: CSSProperties = {
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-neutral-200)',
    backgroundColor: 'var(--color-white)',
  }

  const cfLabelStyle: CSSProperties = {
    fontSize: 'var(--font-xs)',
    fontWeight: 500,
    color: 'var(--color-neutral-500)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    margin: '0 0 4px',
  }

  const cfValueStyle: CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--color-neutral-900)',
    margin: 0,
  }

  const monthInputStyle: CSSProperties = {
    padding: '8px 12px',
    fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-700)',
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-neutral-300)',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    cursor: 'pointer',
  }

  // ─── Render ────────────────────────────────────

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>
              Relatorios
            </h1>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', margin: '4px 0 0' }}>
              Analise de desempenho e resultados
            </p>
          </div>
          {activeTab === 'cashflow' && (
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              style={monthInputStyle}
            />
          )}
        </div>

        {/* Tab bar */}
        <div style={tabBarStyle}>
          <button style={tabBtnStyle(activeTab === 'products')} onClick={() => setActiveTab('products')}>
            Produtos (3 meses)
          </button>
          <button style={tabBtnStyle(activeTab === 'customers')} onClick={() => setActiveTab('customers')}>
            Ranking Clientes
          </button>
          <button style={tabBtnStyle(activeTab === 'cashflow')} onClick={() => setActiveTab('cashflow')}>
            Fluxo de Caixa
          </button>
        </div>

        {/* ─── Products 3 Months ───────────────────── */}
        {activeTab === 'products' && (
          <DataTable
            columns={productColumns}
            rows={productsData ?? []}
            keyExtractor={(row) => row.productId}
            loading={productsLoading}
            searchPlaceholder="Buscar produto..."
            searchKeys={['productName']}
            emptyTitle="Nenhum dado disponivel"
            emptyDescription="Sem vendas registradas nos ultimos 3 meses"
            actions={
              <div style={{ display: 'flex', gap: '4px' }}>
                <button style={toggleBtnStyle(viewMode === 'revenue')} onClick={() => setViewMode('revenue')}>
                  Faturamento
                </button>
                <button style={toggleBtnStyle(viewMode === 'profit')} onClick={() => setViewMode('profit')}>
                  Lucro
                </button>
              </div>
            }
          />
        )}

        {/* ─── Customer Ranking ────────────────────── */}
        {activeTab === 'customers' && (
          <DataTable
            columns={customerColumns}
            rows={customersData ?? []}
            keyExtractor={(row) => row.customerId}
            loading={customersLoading}
            searchPlaceholder="Buscar cliente..."
            searchKeys={['customerName']}
            emptyTitle="Nenhum dado disponivel"
            emptyDescription="Sem vendas registradas nos ultimos 3 meses"
          />
        )}

        {/* ─── Cash Flow ──────────────────────────── */}
        {activeTab === 'cashflow' && (
          <>
            {cashFlowLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton skeleton-card" style={{ height: '120px', borderRadius: 'var(--radius-lg)' }} />)}
              </div>
            ) : cashFlowData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Consolidated summary */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  <div style={cardStyle}>
                    <p style={cfLabelStyle}>Total Entradas</p>
                    <p style={{ ...cfValueStyle, color: 'var(--color-success-600)' }}>
                      {formatCurrency(cashFlowData.consolidated.totalIn)}
                    </p>
                  </div>
                  <div style={cardStyle}>
                    <p style={cfLabelStyle}>Total Saidas</p>
                    <p style={{ ...cfValueStyle, color: 'var(--color-danger-600)' }}>
                      {formatCurrency(cashFlowData.consolidated.totalOut)}
                    </p>
                  </div>
                  <div style={cardStyle}>
                    <p style={cfLabelStyle}>Fluxo Liquido</p>
                    <p style={{
                      ...cfValueStyle,
                      color: cashFlowData.consolidated.netFlow >= 0 ? 'var(--color-success-600)' : 'var(--color-danger-600)',
                    }}>
                      {cashFlowData.consolidated.netFlow >= 0 ? '+' : ''}{formatCurrency(cashFlowData.consolidated.netFlow)}
                    </p>
                  </div>
                </div>

                {/* Per account */}
                {cashFlowData.accounts.length > 0 && (
                  <div style={cardStyle}>
                    <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 16px' }}>
                      Por Conta
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                      {cashFlowData.accounts.map((acc) => (
                        <div key={acc.accountId} style={accountCardStyle}>
                          <p style={{ fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 12px', fontSize: 'var(--font-sm)' }}>
                            {acc.accountName}
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <p style={{ ...cfLabelStyle, fontSize: '0.65rem' }}>Saldo Inicial</p>
                              <p style={{ fontWeight: 600, color: 'var(--color-neutral-700)', margin: 0, fontSize: 'var(--font-sm)' }}>
                                {formatCurrency(acc.openingBalance)}
                              </p>
                            </div>
                            <div>
                              <p style={{ ...cfLabelStyle, fontSize: '0.65rem' }}>Saldo Final</p>
                              <p style={{ fontWeight: 600, color: 'var(--color-neutral-900)', margin: 0, fontSize: 'var(--font-sm)' }}>
                                {formatCurrency(acc.closingBalance)}
                              </p>
                            </div>
                            <div>
                              <p style={{ ...cfLabelStyle, fontSize: '0.65rem' }}>Entradas</p>
                              <p style={{ fontWeight: 500, color: 'var(--color-success-600)', margin: 0, fontSize: 'var(--font-sm)' }}>
                                +{formatCurrency(acc.totalIn)}
                              </p>
                            </div>
                            <div>
                              <p style={{ ...cfLabelStyle, fontSize: '0.65rem' }}>Saidas</p>
                              <p style={{ fontWeight: 500, color: 'var(--color-danger-600)', margin: 0, fontSize: 'var(--font-sm)' }}>
                                -{formatCurrency(acc.totalOut)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* By category */}
                {cashFlowData.byCategory.length > 0 && (
                  <div style={cardStyle}>
                    <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 16px' }}>
                      Por Categoria
                    </h2>
                    <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-sm)' }}>
                        <thead>
                          <tr>
                            <th style={{
                              padding: '10px 16px', textAlign: 'left', fontWeight: 500,
                              color: 'var(--color-neutral-500)', backgroundColor: 'var(--color-neutral-50)',
                              borderBottom: '1px solid var(--color-border)',
                              fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>
                              Categoria
                            </th>
                            <th style={{
                              padding: '10px 16px', textAlign: 'center', fontWeight: 500,
                              color: 'var(--color-neutral-500)', backgroundColor: 'var(--color-neutral-50)',
                              borderBottom: '1px solid var(--color-border)',
                              fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em',
                              width: '100px',
                            }}>
                              Tipo
                            </th>
                            <th style={{
                              padding: '10px 16px', textAlign: 'right', fontWeight: 500,
                              color: 'var(--color-neutral-500)', backgroundColor: 'var(--color-neutral-50)',
                              borderBottom: '1px solid var(--color-border)',
                              fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em',
                              width: '150px',
                            }}>
                              Valor
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {cashFlowData.byCategory.map((cat, i) => (
                            <tr key={`${cat.categoryName}-${cat.type}-${i}`}>
                              <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', fontWeight: 500 }}>
                                {cat.categoryName}
                              </td>
                              <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', textAlign: 'center' }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
                                  fontSize: 'var(--font-xs)', fontWeight: 500, borderRadius: 'var(--radius-full)',
                                  backgroundColor: cat.type === 'IN' ? 'var(--color-success-100)' : 'var(--color-danger-100)',
                                  color: cat.type === 'IN' ? 'var(--color-success-700)' : 'var(--color-danger-700)',
                                }}>
                                  {cat.type === 'IN' ? 'Entrada' : 'Saida'}
                                </span>
                              </td>
                              <td style={{
                                padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)',
                                textAlign: 'right', fontWeight: 600,
                                color: cat.type === 'IN' ? 'var(--color-success-600)' : 'var(--color-danger-600)',
                              }}>
                                {cat.type === 'IN' ? '+' : '-'}{formatCurrency(cat.amount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                ...cardStyle, textAlign: 'center', padding: '48px 24px',
                color: 'var(--color-neutral-400)',
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-neutral-300)', marginBottom: '12px' }}>
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
                <p style={{ fontWeight: 600, color: 'var(--color-neutral-600)', margin: '0 0 4px' }}>
                  Nenhum dado disponivel
                </p>
                <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-400)', margin: 0 }}>
                  Selecione um mes com movimentacoes financeiras
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
