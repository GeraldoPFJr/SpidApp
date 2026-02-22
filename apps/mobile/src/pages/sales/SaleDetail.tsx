import type { CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { formatBRL, formatDate } from '../../lib/format'
import type { SaleItem, Payment, Receivable, SaleStatus } from '@spid/shared'

interface SaleDetailData {
  id: string
  customerName: string | null
  date: string
  status: SaleStatus
  subtotal: number
  discount: number
  surcharge: number
  freight: number
  total: number
  couponNumber: number | null
  notes: string | null
  items: (SaleItem & { productName: string; unitName: string })[]
  payments: (Payment & { accountName?: string })[]
  receivables: (Receivable & { customerName?: string })[]
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  CONFIRMED: { label: 'Confirmada', bg: 'var(--success-100)', color: 'var(--success-700)' },
  DRAFT: { label: 'Rascunho', bg: 'var(--warning-100)', color: 'var(--warning-700)' },
  CANCELLED: { label: 'Cancelada', bg: 'var(--danger-100)', color: 'var(--danger-700)' },
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Dinheiro', PIX: 'Pix', DEBIT_CARD: 'Cartao Debito',
  CREDIT_CARD: 'Cartao Credito', CREDIARIO: 'Crediario', BOLETO: 'Boleto', CHEQUE: 'Cheque',
}

export function SaleDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: sale, loading, error } = useApi<SaleDetailData>(id ? `/sales/${id}` : null)

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
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--sp-2)',
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 'var(--sp-1)',
  }

  const rowStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 'var(--font-sm)',
    padding: 'var(--sp-1) 0',
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-card" style={{ height: '100px' }} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div style={pageStyle}>
        <div className="alert alert-danger">
          <span>Erro ao carregar venda: {error}</span>
        </div>
      </div>
    )
  }

  if (!sale) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: 'center', padding: 'var(--sp-12)' }}>
          <p style={{ fontWeight: 600, fontSize: 'var(--font-lg)', color: 'var(--neutral-700)' }}>
            Venda nao encontrada
          </p>
        </div>
      </div>
    )
  }

  const st = STATUS_CONFIG[sale.status] ?? STATUS_CONFIG['CONFIRMED']

  return (
    <div style={pageStyle} className="animate-fade-in">
      {/* Cabecalho */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {sale.couponNumber && (
              <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                #{String(sale.couponNumber).padStart(6, '0')}
              </span>
            )}
            <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, margin: 0 }}>
              {sale.customerName ?? 'Consumidor Final'}
            </h2>
            <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
              {formatDate(sale.date)}
            </span>
          </div>
          <span style={{
            padding: '4px var(--sp-3)',
            fontSize: 'var(--font-sm)',
            fontWeight: 600,
            borderRadius: 'var(--radius-full)',
            backgroundColor: st?.bg ?? 'var(--success-100)',
            color: st?.color ?? 'var(--success-700)',
          }}>
            {st?.label ?? sale.status}
          </span>
        </div>
        <div style={{ fontSize: 'var(--font-3xl)', fontWeight: 700, color: 'var(--primary)', textAlign: 'center', padding: 'var(--sp-2) 0' }}>
          {formatBRL(sale.total)}
        </div>
      </div>

      {/* Itens */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Itens</span>
        {sale.items.map((item) => (
          <div key={item.id} style={rowStyle}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.productName}</span>
              <span style={{ marginLeft: 'var(--sp-2)', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
                {item.qty} {item.unitName} x {formatBRL(item.unitPrice)}
              </span>
            </div>
            <span style={{ fontWeight: 500 }}>{formatBRL(item.total)}</span>
          </div>
        ))}
        <div className="divider" style={{ margin: 'var(--sp-1) 0' }} />
        <div style={rowStyle}>
          <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
          <span>{formatBRL(sale.subtotal)}</span>
        </div>
        {sale.discount > 0 && (
          <div style={rowStyle}>
            <span style={{ color: 'var(--text-secondary)' }}>Desconto</span>
            <span style={{ color: 'var(--danger-600)' }}>-{formatBRL(sale.discount)}</span>
          </div>
        )}
        {sale.surcharge > 0 && (
          <div style={rowStyle}>
            <span style={{ color: 'var(--text-secondary)' }}>Acrescimo</span>
            <span>+{formatBRL(sale.surcharge)}</span>
          </div>
        )}
        {sale.freight > 0 && (
          <div style={rowStyle}>
            <span style={{ color: 'var(--text-secondary)' }}>Frete</span>
            <span>+{formatBRL(sale.freight)}</span>
          </div>
        )}
      </div>

      {/* Pagamentos */}
      {sale.payments && sale.payments.length > 0 && (
        <div style={sectionStyle}>
          <span style={sectionTitleStyle}>Pagamentos</span>
          {sale.payments.map((pay) => (
            <div key={pay.id} style={rowStyle}>
              <span style={{ color: 'var(--text-primary)' }}>
                {METHOD_LABELS[pay.method] ?? pay.method}
              </span>
              <span style={{ fontWeight: 500 }}>{formatBRL(pay.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Recebiveis */}
      {sale.receivables && sale.receivables.length > 0 && (
        <div style={sectionStyle}>
          <span style={sectionTitleStyle}>Parcelas</span>
          {sale.receivables.map((rec) => (
            <div key={rec.id} style={{ ...rowStyle, alignItems: 'center' }}>
              <div>
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {formatBRL(rec.amount)}
                </span>
                <span style={{ marginLeft: 'var(--sp-2)', color: 'var(--text-muted)', fontSize: 'var(--font-xs)' }}>
                  {formatDate(rec.dueDate)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                <span className={`badge ${rec.status === 'PAID' ? 'badge-success' : rec.status === 'OPEN' ? 'badge-warning' : 'badge-danger'}`}>
                  {rec.status === 'PAID' ? 'Pago' : rec.status === 'OPEN' ? 'Aberto' : 'Cancelado'}
                </span>
                {rec.status === 'OPEN' && (
                  <button className="btn btn-primary btn-sm" style={{ minHeight: '32px' }}>
                    Receber
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Acoes */}
      <div style={{ display: 'flex', gap: 'var(--sp-3)' }}>
        <button className="btn btn-secondary btn-block">
          Imprimir
        </button>
        {sale.status === 'CONFIRMED' && (
          <button
            className="btn btn-danger btn-block"
            onClick={() => navigate(`/vendas/${id}/cancelar`)}
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
}
