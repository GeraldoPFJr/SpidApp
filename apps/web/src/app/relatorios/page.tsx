'use client'

import { type CSSProperties, useMemo, useState } from 'react'
import { Layout } from '@/components/Layout'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useApi } from '@/hooks/useApi'
import { formatCurrency, getCurrentMonth } from '@/lib/format'

// ─── API response types ──────────────────────────────────

type Tab = 'products' | 'customers' | 'cashflow'

interface ApiProduct3m {
  product: { id: string; name: string }
  months: Array<{ month: string; faturamento: number; itensVendidos: number; clientesUnicos: number }>
}

interface ApiCustomer3m {
  customer: { id: string; name: string }
  totalComprado: number
  qtdVendas: number
  prazoMedioPagamento: number
}

interface ApiCashFlow {
  month: string
  byAccount: Array<{
    account: { id: string; name: string; type: string }
    saldoInicial: number
    entradas: number
    saidas: number
    saldoFinal: number
  }>
  byCategory: Array<{ name: string; type: string; total: number }>
  consolidated: {
    saldoInicial: number
    entradas: number
    saidas: number
    saldoFinal: number
  }
}

// ─── Display row types ──────────────────────────────────

interface Product3mRow {
  productId: string
  productName: string
  m2Revenue: number
  m1Revenue: number
  m0Revenue: number
  totalRevenue: number
  totalQty: number
}

interface CustomerRankRow {
  customerId: string
  customerName: string
  totalPurchased: number
  salesCount: number
  avgPaymentDays: number
}

// ─── Mappers ──────────────────────────────────────────

function mapProducts(raw: ApiProduct3m[]): Product3mRow[] {
  return raw.map((item) => {
    const m2 = item.months[0]
    const m1 = item.months[1]
    const m0 = item.months[2]
    return {
      productId: item.product.id,
      productName: item.product.name,
      m2Revenue: m2?.faturamento ?? 0,
      m1Revenue: m1?.faturamento ?? 0,
      m0Revenue: m0?.faturamento ?? 0,
      totalRevenue: (m2?.faturamento ?? 0) + (m1?.faturamento ?? 0) + (m0?.faturamento ?? 0),
      totalQty: (m2?.itensVendidos ?? 0) + (m1?.itensVendidos ?? 0) + (m0?.itensVendidos ?? 0),
    }
  })
}

function mapCustomers(raw: ApiCustomer3m[]): CustomerRankRow[] {
  return raw.map((item) => ({
    customerId: item.customer.id,
    customerName: item.customer.name,
    totalPurchased: item.totalComprado ?? 0,
    salesCount: item.qtdVendas ?? 0,
    avgPaymentDays: item.prazoMedioPagamento ?? 0,
  }))
}

// ─── Component ──────────────────────────────────────────

export default function RelatoriosPage() {
  const [activeTab, setActiveTab] = useState<Tab>('products')
  const [month, setMonth] = useState(getCurrentMonth)

  const { data: rawProducts, loading: productsLoading } = useApi<ApiProduct3m[]>('/reports/products-3m')
  const { data: rawCustomers, loading: customersLoading } = useApi<ApiCustomer3m[]>('/reports/customers-3m')
  const { data: cashFlowData, loading: cashFlowLoading } = useApi<ApiCashFlow>(`/reports/cashflow?month=${month}`)

  const productsData = useMemo(() => mapProducts(rawProducts ?? []), [rawProducts])
  const customersData = useMemo(() => mapCustomers(rawCustomers ?? []), [rawCustomers])

  // ─── Month labels ──────────────────────────────

  const monthLabels = useMemo(() => {
    const parts = month.split('-').map(Number)
    const y = parts[0] ?? 2024
    const m = parts[1] ?? 1
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const getLabel = (offset: number) => {
      let mm = m - offset
      let yy = y
      if (mm <= 0) { mm += 12; yy -= 1 }
      return `${months[mm - 1] ?? 'Jan'}/${yy}`
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
          {formatCurrency(row.m2Revenue)}
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
          {formatCurrency(row.m1Revenue)}
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
          {formatCurrency(row.m0Revenue)}
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
          {formatCurrency(row.totalRevenue)}
        </span>
      ),
    },
    {
      key: 'totalQty',
      header: 'Qtd Vendida',
      align: 'right',
      width: '120px',
      render: (row) => <span style={{ color: 'var(--color-neutral-500)' }}>{(row.totalQty ?? 0).toLocaleString('pt-BR')}</span>,
    },
  ], [monthLabels])

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
            rows={productsData}
            keyExtractor={(row) => row.productId}
            loading={productsLoading}
            searchPlaceholder="Buscar produto..."
            searchKeys={['productName']}
            emptyTitle="Nenhum dado disponivel"
            emptyDescription="Sem vendas registradas nos ultimos 3 meses"
          />
        )}

        {/* ─── Customer Ranking ────────────────────── */}
        {activeTab === 'customers' && (
          <DataTable
            columns={customerColumns}
            rows={customersData}
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
                      {formatCurrency(cashFlowData.consolidated?.entradas)}
                    </p>
                  </div>
                  <div style={cardStyle}>
                    <p style={cfLabelStyle}>Total Saidas</p>
                    <p style={{ ...cfValueStyle, color: 'var(--color-danger-600)' }}>
                      {formatCurrency(cashFlowData.consolidated?.saidas)}
                    </p>
                  </div>
                  <div style={cardStyle}>
                    <p style={cfLabelStyle}>Fluxo Liquido</p>
                    <p style={{
                      ...cfValueStyle,
                      color: ((cashFlowData.consolidated?.entradas ?? 0) - (cashFlowData.consolidated?.saidas ?? 0)) >= 0
                        ? 'var(--color-success-600)' : 'var(--color-danger-600)',
                    }}>
                      {(() => {
                        const net = (cashFlowData.consolidated?.entradas ?? 0) - (cashFlowData.consolidated?.saidas ?? 0)
                        return `${net >= 0 ? '+' : ''}${formatCurrency(net)}`
                      })()}
                    </p>
                  </div>
                </div>

                {/* Per account */}
                {(cashFlowData.byAccount ?? []).length > 0 && (
                  <div style={cardStyle}>
                    <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 16px' }}>
                      Por Conta
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                      {(cashFlowData.byAccount ?? []).map((acc) => (
                        <div key={acc.account.id} style={accountCardStyle}>
                          <p style={{ fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 12px', fontSize: 'var(--font-sm)' }}>
                            {acc.account.name}
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <div>
                              <p style={{ ...cfLabelStyle, fontSize: '0.65rem' }}>Saldo Inicial</p>
                              <p style={{ fontWeight: 600, color: 'var(--color-neutral-700)', margin: 0, fontSize: 'var(--font-sm)' }}>
                                {formatCurrency(acc.saldoInicial)}
                              </p>
                            </div>
                            <div>
                              <p style={{ ...cfLabelStyle, fontSize: '0.65rem' }}>Saldo Final</p>
                              <p style={{ fontWeight: 600, color: 'var(--color-neutral-900)', margin: 0, fontSize: 'var(--font-sm)' }}>
                                {formatCurrency(acc.saldoFinal)}
                              </p>
                            </div>
                            <div>
                              <p style={{ ...cfLabelStyle, fontSize: '0.65rem' }}>Entradas</p>
                              <p style={{ fontWeight: 500, color: 'var(--color-success-600)', margin: 0, fontSize: 'var(--font-sm)' }}>
                                +{formatCurrency(acc.entradas)}
                              </p>
                            </div>
                            <div>
                              <p style={{ ...cfLabelStyle, fontSize: '0.65rem' }}>Saidas</p>
                              <p style={{ fontWeight: 500, color: 'var(--color-danger-600)', margin: 0, fontSize: 'var(--font-sm)' }}>
                                -{formatCurrency(acc.saidas)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* By category */}
                {(cashFlowData.byCategory ?? []).length > 0 && (
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
                          {(cashFlowData.byCategory ?? []).map((cat, i) => {
                            const isIncome = cat.type === 'INCOME' || cat.type === 'APORTE'
                            return (
                              <tr key={`${cat.name}-${cat.type}-${i}`}>
                                <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', fontWeight: 500 }}>
                                  {cat.name}
                                </td>
                                <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', textAlign: 'center' }}>
                                  <span style={{
                                    display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
                                    fontSize: 'var(--font-xs)', fontWeight: 500, borderRadius: 'var(--radius-full)',
                                    backgroundColor: isIncome ? 'var(--color-success-100)' : 'var(--color-danger-100)',
                                    color: isIncome ? 'var(--color-success-700)' : 'var(--color-danger-700)',
                                  }}>
                                    {isIncome ? 'Entrada' : 'Saida'}
                                  </span>
                                </td>
                                <td style={{
                                  padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)',
                                  textAlign: 'right', fontWeight: 600,
                                  color: isIncome ? 'var(--color-success-600)' : 'var(--color-danger-600)',
                                }}>
                                  {isIncome ? '+' : '-'}{formatCurrency(cat.total)}
                                </td>
                              </tr>
                            )
                          })}
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
