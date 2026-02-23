import type { CSSProperties } from 'react'
import { formatBRL } from '../lib/format'

interface CouponSettings {
  nomeFantasia: string
  razaoSocial: string
  endereco: string
  cidade: string
  uf: string
  cep: string
  telefone1: string
  telefone2: string
  cnpj: string
  ie: string
}

interface CouponItem {
  code: string | null
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
  couponNumber: number
  date: string
  customerName: string
  items: CouponItem[]
  subtotal: number
  discount: number
  freight: number
  total: number
  amountReceived: number
  change: number
  payments: CouponPayment[]
  vendedor: string
}

type CouponFormat = '60mm' | '80mm' | 'A5'

interface CouponPreviewProps {
  data: CouponData
  settings: CouponSettings
  format?: CouponFormat
}

const FORMAT_WIDTH: Record<CouponFormat, string> = {
  '60mm': '220px',
  '80mm': '300px',
  'A5': '420px',
}

export function CouponPreview({ data, settings, format = '80mm' }: CouponPreviewProps) {
  const width = FORMAT_WIDTH[format]
  const isNarrow = format === '60mm'

  const containerStyle: CSSProperties = {
    width,
    maxWidth: '100%',
    backgroundColor: '#FFFFFF',
    color: '#000000',
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: isNarrow ? '10px' : '11px',
    lineHeight: 1.4,
    padding: isNarrow ? '8px' : '12px',
    margin: '0 auto',
    border: '1px dashed #ccc',
  }

  const centerStyle: CSSProperties = { textAlign: 'center', margin: '4px 0' }
  const hrStyle: CSSProperties = { border: 'none', borderTop: '1px dashed #000', margin: '6px 0' }
  const rowStyle: CSSProperties = { display: 'flex', justifyContent: 'space-between' }
  const boldStyle: CSSProperties = { fontWeight: 700 }

  const padded = String(data.couponNumber).padStart(6, '0')

  return (
    <div style={containerStyle} id="coupon-preview">
      {/* Cabecalho */}
      <div style={centerStyle}>
        <div style={{ ...boldStyle, fontSize: isNarrow ? '12px' : '14px' }}>
          {settings.nomeFantasia || 'EMPRESA'}
        </div>
        {settings.razaoSocial && (
          <div style={{ fontSize: isNarrow ? '8px' : '9px' }}>{settings.razaoSocial}</div>
        )}
        {settings.endereco && <div>{settings.endereco}</div>}
        {(settings.cidade || settings.uf) && (
          <div>
            {settings.cidade}{settings.uf ? `/${settings.uf}` : ''} {settings.cep && `CEP: ${settings.cep}`}
          </div>
        )}
        {settings.telefone1 && <div>Tel: {settings.telefone1}{settings.telefone2 ? ` / ${settings.telefone2}` : ''}</div>}
        {settings.cnpj && <div>CNPJ: {settings.cnpj}</div>}
        {settings.ie && <div>IE: {settings.ie}</div>}
      </div>

      <hr style={hrStyle} />

      {/* Cliente */}
      <div>Cliente: {data.customerName}</div>
      <div>Data: {new Date(data.date).toLocaleString('pt-BR')}</div>

      <hr style={hrStyle} />

      {/* Titulo */}
      <div style={{ ...centerStyle, ...boldStyle, fontSize: isNarrow ? '11px' : '13px' }}>
        COMPROVANTE DE VENDA
      </div>
      <div style={centerStyle}>N. {padded}</div>

      <hr style={hrStyle} />

      {/* Itens */}
      <div style={{ ...rowStyle, ...boldStyle, marginBottom: '2px' }}>
        <span>Descricao</span>
        <span>R$ Valor</span>
      </div>
      {data.items.map((item, idx) => (
        <div key={idx} style={{ marginBottom: '2px' }}>
          <div style={{ fontSize: isNarrow ? '9px' : '10px', color: '#666' }}>
            {item.code ? `${item.code} - ` : ''}{item.description}
          </div>
          <div style={rowStyle}>
            <span>{item.qty} x {formatBRL(item.unitPrice)}</span>
            <span>{formatBRL(item.total)}</span>
          </div>
        </div>
      ))}

      <hr style={hrStyle} />

      {/* Totais */}
      <div style={rowStyle}>
        <span>Total da Nota</span>
        <span style={boldStyle}>{formatBRL(data.total)}</span>
      </div>
      {data.amountReceived > 0 && data.amountReceived !== data.total && (
        <>
          <div style={rowStyle}>
            <span>Valor Recebido</span>
            <span>{formatBRL(data.amountReceived)}</span>
          </div>
          {data.change > 0 && (
            <div style={rowStyle}>
              <span>Troco</span>
              <span>{formatBRL(data.change)}</span>
            </div>
          )}
        </>
      )}

      <hr style={hrStyle} />

      {/* Formas de pagamento */}
      <div style={boldStyle}>Forma de Pagamento</div>
      {data.payments.length > 0 ? (
        <div style={{ marginTop: '2px' }}>
          <div style={{ ...rowStyle, ...boldStyle, fontSize: isNarrow ? '8px' : '9px', marginBottom: '2px' }}>
            <span>Data Pgto</span>
            <span>Valor</span>
            <span>Tipo</span>
          </div>
          {data.payments.map((pay, idx) => (
            <div key={idx} style={rowStyle}>
              <span>{new Date(pay.date).toLocaleDateString('pt-BR')}</span>
              <span>{formatBRL(pay.amount)}</span>
              <span>{pay.method}</span>
            </div>
          ))}
        </div>
      ) : (
        <div>A vista</div>
      )}

      <hr style={hrStyle} />

      {/* Vendedor */}
      <div>Vendedor: {data.vendedor || '---'}</div>

      <hr style={hrStyle} />

      {/* Aceite */}
      <div style={{ ...centerStyle, fontSize: isNarrow ? '8px' : '9px', margin: '8px 0' }}>
        Declaro ter recebido os itens acima em perfeito estado
      </div>
      <div style={{ borderBottom: '1px solid #000', margin: '16px 24px 4px' }} />
      <div style={{ ...centerStyle, fontSize: isNarrow ? '8px' : '9px' }}>Assinatura</div>

      <hr style={hrStyle} />

      <div style={{ ...centerStyle, ...boldStyle }}>
        OBRIGADO E VOLTE SEMPRE
      </div>
    </div>
  )
}
