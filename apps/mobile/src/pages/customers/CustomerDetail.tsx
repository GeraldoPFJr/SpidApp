import type { CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { formatBRL, formatDate } from '../../lib/format'

interface CustomerDetail {
  id: string
  name: string
  phone: string | null
  doc: string | null
  address: string | null
  notes: string | null
  type: 'PF' | 'PJ' | null
  totalOpen: number
  pendingInstallments: number
  recentSales: Array<{
    id: string
    date: string
    total: number
    status: string
  }>
}

export function CustomerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: customer, loading, error } = useApi<CustomerDetail>(id ? `/customers/${id}` : null)

  const pageStyle: CSSProperties = {
    padding: 'var(--sp-4)',
    paddingBottom: '96px',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--sp-4)',
  }

  const sectionStyle: CSSProperties = {
    backgroundColor: 'var(--surface)',
    borderRadius: 'var(--radius-lg)',
    padding: 'var(--sp-4)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--border)',
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 'var(--sp-3)',
  }

  const rowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 'var(--sp-2) 0',
  }

  const labelStyle: CSSProperties = {
    fontSize: 'var(--font-sm)',
    color: 'var(--text-secondary)',
  }

  const valueStyle: CSSProperties = {
    fontSize: 'var(--font-sm)',
    fontWeight: 500,
    color: 'var(--text-primary)',
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-card" style={{ height: '120px' }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <div className="alert alert-danger">
          <span>Erro ao carregar cliente: {error}</span>
        </div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', padding: 'var(--sp-12)', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, fontSize: 'var(--font-lg)', color: 'var(--neutral-700)' }}>
            Cliente nao encontrado
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle} className="animate-fade-in">
      {/* Info */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)' }}>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {customer.name}
          </h2>
          {customer.type && (
            <span className="badge badge-default">{customer.type}</span>
          )}
        </div>
        {customer.phone && (
          <div style={rowStyle}>
            <span style={labelStyle}>Telefone</span>
            <a href={`tel:${customer.phone}`} style={{ ...valueStyle, color: 'var(--primary)' }}>{customer.phone}</a>
          </div>
        )}
        {customer.doc && (
          <div style={rowStyle}>
            <span style={labelStyle}>Documento</span>
            <span style={valueStyle}>{customer.doc}</span>
          </div>
        )}
        {customer.address && (
          <div style={rowStyle}>
            <span style={labelStyle}>Endereco</span>
            <span style={valueStyle}>{customer.address}</span>
          </div>
        )}
        {customer.notes && (
          <div style={{ marginTop: 'var(--sp-2)' }}>
            <span style={labelStyle}>Observacoes</span>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-primary)', marginTop: 'var(--sp-1)' }}>
              {customer.notes}
            </p>
          </div>
        )}
      </div>

      {/* Resumo Financeiro */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Resumo Financeiro</span>
        <div className="grid-2">
          <div style={{
            padding: 'var(--sp-3)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: (customer.totalOpen ?? 0) > 0 ? 'var(--danger-50)' : 'var(--neutral-50)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--sp-1)' }}>
              Em Aberto
            </div>
            <div style={{
              fontSize: 'var(--font-lg)',
              fontWeight: 700,
              color: (customer.totalOpen ?? 0) > 0 ? 'var(--danger-600)' : 'var(--text-primary)',
            }}>
              {formatBRL(customer.totalOpen ?? 0)}
            </div>
          </div>
          <div style={{
            padding: 'var(--sp-3)',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--neutral-50)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--sp-1)' }}>
              Parcelas Pendentes
            </div>
            <div style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {customer.pendingInstallments ?? 0}
            </div>
          </div>
        </div>
      </div>

      {/* Historico de Compras */}
      {customer.recentSales && customer.recentSales.length > 0 && (
        <div style={sectionStyle}>
          <span style={sectionTitleStyle}>Compras Recentes</span>
          {customer.recentSales.map((sale) => (
            <div
              key={sale.id}
              style={{
                ...rowStyle,
                cursor: 'pointer',
                borderBottom: '1px solid var(--border)',
                paddingBottom: 'var(--sp-2)',
              }}
              onClick={() => navigate(`/vendas/${sale.id}`)}
            >
              <div>
                <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                  {formatBRL(sale.total)}
                </span>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginLeft: 'var(--sp-2)' }}>
                  {formatDate(sale.date)}
                </span>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--neutral-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </div>
          ))}
        </div>
      )}

      {/* Acoes */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
        <button
          className="btn btn-primary btn-lg btn-block"
          onClick={() => navigate(`/vendas/nova?customerId=${id}`)}
        >
          Nova Venda
        </button>
        <button
          className="btn btn-secondary btn-block"
          onClick={() => navigate(`/clientes/${id}/editar`)}
        >
          Editar
        </button>
      </div>
    </div>
  )
}
