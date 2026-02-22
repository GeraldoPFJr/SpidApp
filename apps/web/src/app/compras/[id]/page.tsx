'use client'

import { type CSSProperties } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { useApi } from '@/hooks/useApi'
import { formatCurrency, formatDate } from '@/lib/format'

interface PurchaseRawItem {
  id: string
  productId: string
  unitId: string
  qty: number
  unitCost: number
  totalCost: number
  product?: { name: string } | null
  unit?: { nameLabel: string } | null
  productName?: string
  unitLabel?: string
}

interface PurchaseRawCost {
  id: string
  label: string
  amount: number
}

interface PurchaseRaw {
  id: string
  date: string
  notes: string | null
  status: string
  total?: number
  supplier?: { name: string } | null
  supplierName?: string
  items: PurchaseRawItem[]
  costs?: PurchaseRawCost[]
  extraCosts?: PurchaseRawCost[]
}

interface PurchaseDetail {
  id: string
  supplierName: string
  date: string
  notes: string | null
  status: string
  items: Array<{
    id: string
    productName: string
    unitLabel: string
    qty: number
    unitCost: number
    totalCost: number
  }>
  extraCosts: Array<{
    id: string
    label: string
    amount: number
  }>
  total: number
}

function mapPurchaseDetail(raw: PurchaseRaw): PurchaseDetail {
  const items = raw.items.map((i) => ({
    id: i.id,
    productName: i.productName ?? i.product?.name ?? 'Produto',
    unitLabel: i.unitLabel ?? i.unit?.nameLabel ?? 'Unid.',
    qty: Number(i.qty),
    unitCost: Number(i.unitCost),
    totalCost: Number(i.totalCost),
  }))
  const extraCosts = (raw.extraCosts ?? raw.costs ?? []).map((c) => ({
    id: c.id,
    label: c.label,
    amount: Number(c.amount),
  }))
  const itemsTotal = items.reduce((sum, i) => sum + i.totalCost, 0)
  const costsTotal = extraCosts.reduce((sum, c) => sum + c.amount, 0)
  return {
    id: raw.id,
    supplierName: raw.supplierName ?? raw.supplier?.name ?? 'Sem fornecedor',
    date: raw.date,
    notes: raw.notes,
    status: raw.status,
    items,
    extraCosts,
    total: raw.total != null ? Number(raw.total) : itemsTotal + costsTotal,
  }
}

export default function CompraDetalhePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: rawPurchase, loading } = useApi<PurchaseRaw>(`/purchases/${id}`)
  const purchase = rawPurchase ? mapPurchaseDetail(rawPurchase) : null

  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)', padding: '24px', boxShadow: 'var(--shadow-sm)',
  }

  const infoLabelStyle: CSSProperties = {
    fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--color-neutral-500)',
    textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px',
  }

  const infoValueStyle: CSSProperties = {
    fontSize: 'var(--font-base)', fontWeight: 500, color: 'var(--color-neutral-800)', margin: 0,
  }

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="skeleton" style={{ height: '32px', width: '300px' }} />
          <div className="skeleton skeleton-card" style={{ height: '200px' }} />
        </div>
      </Layout>
    )
  }

  if (!purchase) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-neutral-500)' }}>Compra nao encontrada</div>
      </Layout>
    )
  }

  const itemsTotal = purchase.items.reduce((sum, i) => sum + i.totalCost, 0)
  const extraTotal = purchase.extraCosts.reduce((sum, c) => sum + c.amount, 0)

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '960px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.back()} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px',
            borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)', cursor: 'pointer',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>Compra - {purchase.supplierName}</h1>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '20px' }}>
            <div><p style={infoLabelStyle}>Fornecedor</p><p style={infoValueStyle}>{purchase.supplierName}</p></div>
            <div><p style={infoLabelStyle}>Data</p><p style={infoValueStyle}>{formatDate(purchase.date)}</p></div>
            <div><p style={infoLabelStyle}>Total</p><p style={{ ...infoValueStyle, fontSize: '1.25rem', fontWeight: 700 }}>{formatCurrency(purchase.total)}</p></div>
            {purchase.notes && <div><p style={infoLabelStyle}>Observacao</p><p style={infoValueStyle}>{purchase.notes}</p></div>}
          </div>
        </div>

        {/* Items */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 16px' }}>Itens</h2>
          <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-sm)' }}>
              <thead>
                <tr>
                  {['Produto', 'Unidade', 'Qtd', 'Custo Unit.', 'Total'].map((h, i) => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: i >= 2 ? 'right' : 'left', fontWeight: 500, color: 'var(--color-neutral-500)', backgroundColor: 'var(--color-neutral-50)', borderBottom: '1px solid var(--color-border)', fontSize: 'var(--font-xs)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', fontWeight: 500 }}>{item.productName}</td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)' }}>{item.unitLabel}</td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', textAlign: 'right' }}>{item.qty}</td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', textAlign: 'right' }}>{formatCurrency(item.unitCost)}</td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-neutral-100)', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.totalCost)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 500, color: 'var(--color-neutral-600)' }}>Subtotal Itens</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700 }}>{formatCurrency(itemsTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Extra Costs */}
        {purchase.extraCosts.length > 0 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 16px' }}>Custos Extras</h2>
            {purchase.extraCosts.map((c) => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-neutral-100)', fontSize: 'var(--font-sm)' }}>
                <span style={{ color: 'var(--color-neutral-700)' }}>{c.label}</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(c.amount)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', marginTop: '8px', borderTop: '2px solid var(--color-neutral-800)' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-neutral-700)' }}>Total Custos Extras</span>
              <span style={{ fontWeight: 700, fontSize: 'var(--font-lg)' }}>{formatCurrency(extraTotal)}</span>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
