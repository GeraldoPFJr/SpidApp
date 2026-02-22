import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'
import { formatBRL, formatDate, getCurrentMonth, formatMonthLabel } from '../lib/format'

interface DashboardData {
  revenue: number
  grossProfit: number
  netProfit: number
  salesCount: number
  averageTicket: number
  received: number
  toReceive: number
  expenses: number
  newCustomers: number
  recentSales: Array<{
    id: string
    date: string
    customerName: string | null
    total: number
    status: string
  }>
}

interface MetricCardProps {
  label: string
  value: string
  subtitle?: string
  tooltip?: string
  accent?: 'primary' | 'success' | 'danger' | 'warning'
}

function MetricCard({ label, value, subtitle, tooltip, accent }: MetricCardProps) {
  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--sp-4)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--sp-1)',
    position: 'relative',
  }

  const labelStyle: CSSProperties = {
    fontSize: 'var(--font-xs)',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const valueColorMap = {
    primary: 'var(--primary)',
    success: 'var(--success-600)',
    danger: 'var(--danger-600)',
    warning: 'var(--warning-600)',
  }

  const valueStyle: CSSProperties = {
    fontSize: 'var(--font-xl)',
    fontWeight: 700,
    color: accent ? valueColorMap[accent] : 'var(--text-primary)',
    lineHeight: 1.2,
  }

  const subtitleStyle: CSSProperties = {
    fontSize: 'var(--font-xs)',
    color: 'var(--text-muted)',
  }

  const tooltipStyle: CSSProperties = {
    position: 'absolute',
    top: 'var(--sp-2)',
    right: 'var(--sp-2)',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: 'var(--neutral-100)',
    color: 'var(--text-muted)',
    fontSize: '11px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'help',
    border: 'none',
  }

  return (
    <div style={cardStyle} className="animate-slide-up">
      {tooltip && (
        <span style={tooltipStyle} title={tooltip}>?</span>
      )}
      <span style={labelStyle}>{label}</span>
      <span style={valueStyle}>{value}</span>
      {subtitle && <span style={subtitleStyle}>{subtitle}</span>}
    </div>
  )
}

function SkeletonCard() {
  const style: CSSProperties = {
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--sp-4)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--sp-2)',
  }

  return (
    <div style={style}>
      <div className="skeleton skeleton-text" style={{ width: '60%' }} />
      <div className="skeleton skeleton-text" style={{ width: '80%', height: '24px' }} />
    </div>
  )
}

function ProgressBar({ received, toReceive }: { received: number; toReceive: number }) {
  const total = received + toReceive
  const pct = total > 0 ? Math.round((received / total) * 100) : 0

  const containerStyle: CSSProperties = {
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--sp-4)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--sp-2)',
  }

  const labelRowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 'var(--font-xs)',
    color: 'var(--text-secondary)',
  }

  return (
    <div style={containerStyle} className="animate-slide-up">
      <span style={{ fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Recebido vs A Receber
      </span>
      <div className="progress-bar">
        <div className="progress-bar-fill success" style={{ width: `${pct}%` }} />
      </div>
      <div style={labelRowStyle}>
        <span>Recebido: {formatBRL(received)}</span>
        <span>A receber: {formatBRL(toReceive)}</span>
      </div>
    </div>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const month = getCurrentMonth()
  const { data, loading, error } = useApi<DashboardData>(`/reports/dashboard?month=${month}`)

  const pageStyle: CSSProperties = {
    padding: 'var(--sp-4)',
    paddingBottom: '96px',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--sp-4)',
  }

  const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 'var(--sp-2)',
  }

  const monthLabelStyle: CSSProperties = {
    fontSize: 'var(--font-sm)',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  }

  const newSaleBtnStyle: CSSProperties = {
    width: '100%',
    padding: 'var(--sp-4)',
    backgroundColor: 'var(--primary)',
    color: 'var(--neutral-0)',
    border: 'none',
    borderRadius: 'var(--radius-lg)',
    fontSize: 'var(--font-lg)',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 'var(--sp-2)',
    boxShadow: 'var(--shadow-md)',
    transition: 'all var(--transition-fast)',
    minHeight: '56px',
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const saleRowStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--sp-3) var(--sp-4)',
    backgroundColor: 'var(--surface)',
    borderBottom: '1px solid var(--border)',
    cursor: 'pointer',
    minHeight: '52px',
    transition: 'background-color var(--transition-fast)',
  }

  const statusColors: Record<string, { bg: string; color: string }> = {
    CONFIRMED: { bg: 'var(--success-100)', color: 'var(--success-700)' },
    DRAFT: { bg: 'var(--warning-100)', color: 'var(--warning-700)' },
    CANCELLED: { bg: 'var(--danger-100)', color: 'var(--danger-700)' },
  }

  const statusLabels: Record<string, string> = {
    CONFIRMED: 'Confirmada',
    DRAFT: 'Rascunho',
    CANCELLED: 'Cancelada',
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        <div style={headerStyle}>
          <span style={monthLabelStyle}>Carregando...</span>
        </div>
        <div className="grid-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <div className="alert alert-danger">
          <span>Erro ao carregar dashboard: {error}</span>
        </div>
        <button
          style={newSaleBtnStyle}
          onClick={() => navigate('/vendas/nova')}
        >
          Nova Venda
        </button>
      </div>
    )
  }

  const d = data ?? {
    revenue: 0,
    grossProfit: 0,
    netProfit: 0,
    salesCount: 0,
    averageTicket: 0,
    received: 0,
    toReceive: 0,
    expenses: 0,
    newCustomers: 0,
    recentSales: [],
  }

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <span style={monthLabelStyle}>{formatMonthLabel(month)}</span>
      </div>

      {/* CTA Nova Venda */}
      <button
        style={newSaleBtnStyle}
        onClick={() => navigate('/vendas/nova')}
        className="animate-slide-up"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Nova Venda
      </button>

      {/* Metricas Grid */}
      <div className="grid-2 stagger">
        <MetricCard
          label="Faturamento"
          value={formatBRL(d.revenue)}
          accent="primary"
        />
        <MetricCard
          label="Lucro Bruto"
          value={formatBRL(d.grossProfit)}
          accent="success"
          tooltip="Lucro bruto = vendas - custo do produto"
        />
        <MetricCard
          label="Lucro Liquido"
          value={formatBRL(d.netProfit)}
          accent="success"
          tooltip="Lucro liquido = receitas - custo do produto - rateio das despesas"
        />
        <MetricCard
          label="Vendas"
          value={String(d.salesCount)}
        />
        <MetricCard
          label="Ticket Medio"
          value={formatBRL(d.averageTicket)}
        />
        <MetricCard
          label="Despesas"
          value={formatBRL(d.expenses)}
          accent="danger"
        />
        <MetricCard
          label="Clientes Novos"
          value={String(d.newCustomers)}
        />
      </div>

      {/* Progresso Recebido / A Receber */}
      <ProgressBar received={d.received} toReceive={d.toReceive} />

      {/* Ultimas Vendas */}
      {d.recentSales.length > 0 && (
        <div>
          <span style={sectionTitleStyle}>Ultimas Vendas</span>
          <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginTop: 'var(--sp-2)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
            {d.recentSales.map((sale, idx) => {
              const st = statusColors[sale.status] ?? statusColors['CONFIRMED']
              return (
                <div
                  key={sale.id}
                  style={{
                    ...saleRowStyle,
                    borderBottom: idx < d.recentSales.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                  onClick={() => navigate(`/vendas/${sale.id}`)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {sale.customerName ?? 'Consumidor Final'}
                    </span>
                    <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                      {formatDate(sale.date)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                    <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {formatBRL(sale.total)}
                    </span>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '2px var(--sp-2)',
                      fontSize: 'var(--font-xs)',
                      fontWeight: 500,
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: st?.bg ?? 'var(--success-100)',
                      color: st?.color ?? 'var(--success-700)',
                    }}>
                      {statusLabels[sale.status] ?? sale.status}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
