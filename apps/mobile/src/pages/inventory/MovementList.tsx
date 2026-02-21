import { type CSSProperties, useMemo, useState } from 'react'
import { useApi, useApiMutation } from '../../hooks/useApi'
import { formatDate } from '../../lib/format'
import type { InventoryMovement } from '@spid/shared'

interface MovementWithProduct extends InventoryMovement {
  productName: string
}

const REASON_LABELS: Record<string, string> = {
  PURCHASE: 'Compra', SALE: 'Venda', ADJUSTMENT: 'Ajuste', LOSS: 'Perda',
  CONSUMPTION: 'Consumo', DONATION: 'Doacao', RETURN: 'Devolucao', INVENTORY_COUNT: 'Contagem',
}

export function MovementListPage() {
  const { data: movements, loading, refetch } = useApi<MovementWithProduct[]>('/inventory/movements')
  const { execute: createMovement, loading: creating } = useApiMutation('/inventory/movements')
  const [showForm, setShowForm] = useState(false)
  const [formProductId, setFormProductId] = useState('')
  const [formDirection, setFormDirection] = useState<'IN' | 'OUT'>('OUT')
  const [formQty, setFormQty] = useState(1)
  const [formReason, setFormReason] = useState('ADJUSTMENT')
  const [formNotes, setFormNotes] = useState('')

  const { data: products } = useApi<Array<{ id: string; name: string }>>('/products')

  const pageStyle: CSSProperties = { padding: 'var(--sp-4)', paddingBottom: '96px', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }
  const sectionStyle: CSSProperties = { backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-4)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }
  const sectionTitleStyle: CSSProperties = { fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }
  const labelStyle: CSSProperties = { fontSize: 'var(--font-xs)', fontWeight: 500, color: 'var(--neutral-700)', marginBottom: 'var(--sp-1)', display: 'block' }
  const inputStyle: CSSProperties = { width: '100%', padding: 'var(--sp-2) var(--sp-3)', fontSize: 'var(--font-base)', border: '1px solid var(--neutral-300)', borderRadius: 'var(--radius-md)', outline: 'none', backgroundColor: 'var(--surface)', minHeight: '44px' }
  const selectStyle: CSSProperties = { ...inputStyle, cursor: 'pointer' }

  async function handleCreateMovement() {
    if (!formProductId || formQty <= 0) return
    await createMovement({ productId: formProductId, direction: formDirection, qtyBase: formQty, reasonType: formReason, notes: formNotes.trim() || null })
    setShowForm(false)
    setFormProductId('')
    setFormQty(1)
    setFormNotes('')
    refetch()
  }

  if (loading) {
    return <div style={pageStyle}>{Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton skeleton-card" />)}</div>
  }

  return (
    <div style={pageStyle}>
      <button className="btn btn-primary btn-block" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'Cancelar' : '+ Movimentacao Manual'}
      </button>

      {showForm && (
        <div style={sectionStyle} className="animate-slide-up">
          <span style={sectionTitleStyle}>Nova Movimentacao</span>
          <div>
            <label style={labelStyle}>Produto</label>
            <select style={selectStyle} value={formProductId} onChange={(e) => setFormProductId(e.target.value)}>
              <option value="">Selecione</option>
              {products?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div>
              <label style={labelStyle}>Direcao</label>
              <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>
                {(['IN', 'OUT'] as const).map((d) => (
                  <button key={d} style={{
                    flex: 1, padding: 'var(--sp-2)', border: `1px solid ${formDirection === d ? (d === 'IN' ? 'var(--success-500)' : 'var(--danger-500)') : 'var(--neutral-300)'}`,
                    borderRadius: 'var(--radius-md)', backgroundColor: formDirection === d ? (d === 'IN' ? 'var(--success-50)' : 'var(--danger-50)') : 'var(--surface)',
                    color: formDirection === d ? (d === 'IN' ? 'var(--success-700)' : 'var(--danger-700)') : 'var(--text-secondary)',
                    fontWeight: 500, fontSize: 'var(--font-sm)', cursor: 'pointer', minHeight: '44px',
                  }} onClick={() => setFormDirection(d)}>
                    {d === 'IN' ? 'Entrada' : 'Saida'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Quantidade</label>
              <input type="number" style={inputStyle} value={formQty} onChange={(e) => setFormQty(Math.max(1, parseInt(e.target.value, 10) || 1))} min={1} inputMode="numeric" />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Motivo</label>
            <select style={selectStyle} value={formReason} onChange={(e) => setFormReason(e.target.value)}>
              <option value="ADJUSTMENT">Ajuste</option>
              <option value="LOSS">Perda</option>
              <option value="CONSUMPTION">Consumo</option>
              <option value="DONATION">Doacao</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Observacoes</label>
            <input style={inputStyle} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} placeholder="Opcional" />
          </div>
          <button className="btn btn-primary btn-block" onClick={handleCreateMovement} disabled={creating}>
            {creating ? 'Salvando...' : 'Registrar'}
          </button>
        </div>
      )}

      {movements && movements.length > 0 ? (
        <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
          {movements.map((mov, idx) => (
            <div key={mov.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: 'var(--sp-3) var(--sp-4)', backgroundColor: 'var(--surface)',
              borderBottom: idx < movements.length - 1 ? '1px solid var(--border)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-3)' }}>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 700,
                  backgroundColor: mov.direction === 'IN' ? 'var(--success-100)' : 'var(--danger-100)',
                  color: mov.direction === 'IN' ? 'var(--success-700)' : 'var(--danger-700)',
                }}>
                  {mov.direction === 'IN' ? '+' : '-'}
                </span>
                <div>
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500, display: 'block' }}>{mov.productName}</span>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    {REASON_LABELS[mov.reasonType] ?? mov.reasonType} - {formatDate(mov.date)}
                  </span>
                </div>
              </div>
              <span style={{
                fontSize: 'var(--font-base)', fontWeight: 600,
                color: mov.direction === 'IN' ? 'var(--success-600)' : 'var(--danger-600)',
              }}>
                {mov.direction === 'IN' ? '+' : '-'}{mov.qtyBase}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: 'var(--sp-12)', color: 'var(--text-muted)' }}>
          <p style={{ fontWeight: 600, color: 'var(--neutral-700)' }}>Nenhuma movimentacao</p>
        </div>
      )}
    </div>
  )
}
