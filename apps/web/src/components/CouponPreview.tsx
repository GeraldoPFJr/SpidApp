'use client'

import { type CSSProperties, useCallback } from 'react'
import { formatCurrency, formatDateTime } from '@/lib/format'

interface CouponItem {
  code: string
  description: string
  qty: number
  unitPrice: number
  total: number
}

interface CouponPayment {
  date: string
  amount: number
  method: string
}

interface CouponData {
  companyName: string
  companyLegalName?: string
  companyAddress?: string
  companyCityState?: string
  companyPhones?: string
  companyCnpj?: string
  companyIe?: string
  customerName: string
  date: string
  couponNumber: number
  items: CouponItem[]
  subtotal: number
  discount: number
  surcharge: number
  freight: number
  total: number
  payments: CouponPayment[]
  sellerName?: string
}

interface CouponPreviewProps {
  data: CouponData
  onPrint?: () => void
}

export function CouponPreview({ data, onPrint }: CouponPreviewProps) {
  const handlePrint = useCallback(() => {
    if (onPrint) {
      onPrint()
      return
    }
    window.print()
  }, [onPrint])

  const containerStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-sm)',
    overflow: 'hidden',
  }

  const previewStyle: CSSProperties = {
    padding: '32px',
    fontFamily: "'Courier New', monospace",
    fontSize: '12px',
    lineHeight: 1.6,
    maxWidth: '360px',
    margin: '0 auto',
    color: '#000',
  }

  const centerStyle: CSSProperties = {
    textAlign: 'center',
  }

  const hrStyle: CSSProperties = {
    border: 'none',
    borderTop: '1px dashed #999',
    margin: '8px 0',
  }

  const tableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '11px',
  }

  const thStyle: CSSProperties = {
    textAlign: 'left',
    padding: '2px 0',
    borderBottom: '1px solid #ccc',
    fontWeight: 600,
  }

  const tdStyle: CSSProperties = {
    padding: '2px 0',
  }

  const actionsStyle: CSSProperties = {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    padding: '16px',
    borderTop: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-neutral-50)',
  }

  const btnStyle = (primary: boolean): CSSProperties => ({
    padding: '8px 20px',
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
    color: primary ? 'var(--color-white)' : 'var(--color-neutral-600)',
    backgroundColor: primary ? 'var(--color-primary-600)' : 'var(--color-white)',
    border: primary ? 'none' : '1px solid var(--color-neutral-300)',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
  })

  return (
    <div style={containerStyle}>
      {/* Actions bar - not printed */}
      <div style={actionsStyle} className="no-print">
        <button onClick={handlePrint} style={btnStyle(true)}>
          Imprimir
        </button>
        <button onClick={() => {}} style={btnStyle(false)}>
          Baixar PDF
        </button>
      </div>

      {/* Coupon content */}
      <div style={previewStyle} id="coupon-content">
        {/* Header */}
        <div style={centerStyle}>
          <strong style={{ fontSize: '14px' }}>{data.companyName}</strong>
          {data.companyLegalName && <div>{data.companyLegalName}</div>}
          {data.companyAddress && <div>{data.companyAddress}</div>}
          {data.companyCityState && <div>{data.companyCityState}</div>}
          {data.companyPhones && <div>Tel: {data.companyPhones}</div>}
        </div>

        <hr style={hrStyle} />

        {data.companyCnpj && <div>CNPJ: {data.companyCnpj}</div>}
        {data.companyIe && <div>IE: {data.companyIe}</div>}

        <hr style={hrStyle} />

        <div>Cliente: {data.customerName}</div>
        <div>Data: {formatDateTime(data.date)}</div>

        <hr style={hrStyle} />

        <div style={centerStyle}>
          <strong>COMPROVANTE DE VENDA</strong>
          <br />
          <strong>N. {String(data.couponNumber).padStart(6, '0')}</strong>
        </div>

        <hr style={hrStyle} />

        {/* Items */}
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Cod</th>
              <th style={thStyle}>Descricao</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>QTDxUNIT</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Valor</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i}>
                <td style={tdStyle}>{item.code}</td>
                <td style={tdStyle}>{item.description}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{item.qty}x{formatCurrency(item.unitPrice)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr style={hrStyle} />

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Total da Nota:</span>
          <strong>{formatCurrency(data.total)}</strong>
        </div>
        {data.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Desconto:</span>
            <span>- {formatCurrency(data.discount)}</span>
          </div>
        )}
        {data.surcharge > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Acrescimo:</span>
            <span>+ {formatCurrency(data.surcharge)}</span>
          </div>
        )}
        {data.freight > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Frete:</span>
            <span>+ {formatCurrency(data.freight)}</span>
          </div>
        )}

        <hr style={hrStyle} />

        {/* Payments */}
        <div style={centerStyle}><strong>PAGAMENTO</strong></div>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Data Pgto</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Valor</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {data.payments.map((p, i) => (
              <tr key={i}>
                <td style={tdStyle}>{p.date}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatCurrency(p.amount)}</td>
                <td style={{ ...tdStyle, textAlign: 'right' }}>{p.method}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr style={hrStyle} />

        {data.sellerName && <div>Vendedor: {data.sellerName}</div>}
        <div>N. de serie: -</div>

        <hr style={hrStyle} />

        <div style={{ fontSize: '10px', lineHeight: 1.4 }}>
          Declaro que recebi os produtos/servicos descritos acima em perfeitas condicoes.
        </div>

        <div style={{ marginTop: '24px', borderTop: '1px solid #000', textAlign: 'center', paddingTop: '4px', fontSize: '10px' }}>
          Assinatura do Cliente
        </div>

        <hr style={hrStyle} />

        <div style={{ ...centerStyle, fontWeight: 600, marginTop: '8px' }}>
          OBRIGADO E VOLTE SEMPRE
        </div>
      </div>
    </div>
  )
}
