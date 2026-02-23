'use client'

import { useMemo, useState } from 'react'
import { Layout } from '@/components/Layout'
import { DataTable, type DataTableColumn } from '@/components/DataTable'
import { useApi } from '@/hooks/useApi'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { apiClient } from '@/lib/api'
import { formatDate } from '@/lib/format'

interface MovementRow {
  id: string
  date: string
  productName: string
  direction: string
  qtyBase: number
  reasonType: string
  notes: string | null
}

const REASON_MAP: Record<string, string> = {
  PURCHASE: 'Compra', SALE: 'Venda', ADJUSTMENT: 'Ajuste', LOSS: 'Perda',
  CONSUMPTION: 'Consumo', DONATION: 'Doacao', RETURN: 'Devolucao', INVENTORY_COUNT: 'Inventario',
}

export default function MovimentacoesPage() {
  const { isMobile } = useMediaQuery()
  const { data, loading, refetch } = useApi<MovementRow[]>('/inventory/movements')
  const [showModal, setShowModal] = useState(false)
  const [newProductId, setNewProductId] = useState('')
  const [newDirection, setNewDirection] = useState<'IN' | 'OUT'>('IN')
  const [newQty, setNewQty] = useState('')
  const [newReason, setNewReason] = useState('ADJUSTMENT')
  const [newNotes, setNewNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: products } = useApi<Array<{ id: string; name: string }>>('/products')

  const columns: DataTableColumn<MovementRow>[] = useMemo(() => [
    { key: 'date', header: 'Data', width: '120px', render: (row) => formatDate(row.date) },
    { key: 'productName', header: 'Produto', render: (row) => <span style={{ fontWeight: 500 }}>{row.productName}</span> },
    {
      key: 'direction', header: 'Direcao', width: '100px',
      render: (row) => (
        <span style={{
          display: 'inline-flex', alignItems: 'center', padding: '2px 10px',
          fontSize: 'var(--font-xs)', fontWeight: 500, borderRadius: 'var(--radius-full)',
          backgroundColor: row.direction === 'IN' ? 'var(--color-success-100)' : 'var(--color-danger-100)',
          color: row.direction === 'IN' ? 'var(--color-success-700)' : 'var(--color-danger-700)',
        }}>
          {row.direction === 'IN' ? 'Entrada' : 'Saida'}
        </span>
      ),
    },
    { key: 'qtyBase', header: 'Quantidade', width: '120px', align: 'right', render: (row) => <span style={{ fontWeight: 500 }}>{row.qtyBase.toLocaleString('pt-BR')}</span> },
    { key: 'reasonType', header: 'Motivo', width: '130px', render: (row) => REASON_MAP[row.reasonType] ?? row.reasonType },
    { key: 'notes', header: 'Obs', render: (row) => <span style={{ color: 'var(--color-neutral-500)' }}>{row.notes ?? '-'}</span> },
  ], [])

  const handleSave = async () => {
    if (!newProductId || !newQty) return
    setSaving(true)
    setSubmitError(null)
    try {
      await apiClient('/inventory/movements', {
        method: 'POST',
        body: { productId: newProductId, direction: newDirection, qtyBase: parseInt(newQty, 10), reasonType: newReason, notes: newNotes || null },
      })
      setShowModal(false)
      setNewProductId(''); setNewQty(''); setNewNotes('')
      setSubmitError(null)
      refetch()
    } catch {
      setSubmitError('Erro ao criar movimentacao. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: isMobile ? '10px 12px' : '8px 12px',
    fontSize: 'var(--font-sm)', color: 'var(--color-neutral-800)',
    backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)',
    borderRadius: 'var(--radius-md)', outline: 'none',
    minHeight: isMobile ? '44px' : 'auto',
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 'var(--font-xl)' : 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>Movimentacoes de Estoque</h1>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', margin: '4px 0 0' }}>Entradas e saidas de estoque</p>
        </div>
        <DataTable
          columns={columns}
          rows={data ?? []}
          keyExtractor={(row) => row.id}
          loading={loading}
          searchPlaceholder="Buscar por produto..."
          searchKeys={['productName', 'reasonType']}
          actions={
            <button onClick={() => setShowModal(true)} style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              padding: isMobile ? '10px 14px' : '8px 16px',
              fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--color-white)',
              backgroundColor: 'var(--color-primary-600)', border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
              minHeight: '44px',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              {isMobile ? 'Nova' : 'Nova Movimentacao'}
            </button>
          }
          emptyTitle="Nenhuma movimentacao"
        />

        {/* Modal */}
        {showModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', zIndex: 1000, padding: isMobile ? '0' : '16px' }} onClick={() => setShowModal(false)}>
            <div style={{
              backgroundColor: 'var(--color-white)',
              borderRadius: isMobile ? 'var(--radius-xl) var(--radius-xl) 0 0' : 'var(--radius-xl)',
              boxShadow: 'var(--shadow-xl)',
              width: '100%', maxWidth: isMobile ? '100%' : '480px',
              padding: '24px',
              maxHeight: isMobile ? '90vh' : 'auto',
              overflowY: 'auto',
            }} onClick={(e) => e.stopPropagation()}>
              {isMobile && (
                <div style={{ width: '36px', height: '4px', borderRadius: '2px', backgroundColor: 'var(--color-neutral-300)', margin: '0 auto 16px' }} />
              )}
              <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-900)', margin: '0 0 20px' }}>Nova Movimentacao</h2>
              {submitError && (
                <div style={{ padding: '10px 14px', marginBottom: '12px', backgroundColor: 'var(--color-danger-50)', border: '1px solid var(--color-danger-100)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-700)', fontSize: 'var(--font-sm)' }}>
                  {submitError}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-700)', display: 'block', marginBottom: '4px' }}>Produto *</label>
                  <select value={newProductId} onChange={(e) => setNewProductId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Selecione...</option>
                    {products?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-700)', display: 'block', marginBottom: '4px' }}>Direcao</label>
                    <select value={newDirection} onChange={(e) => setNewDirection(e.target.value as 'IN' | 'OUT')} style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="IN">Entrada</option>
                      <option value="OUT">Saida</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-700)', display: 'block', marginBottom: '4px' }}>Quantidade (base) *</label>
                    <input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} min="1" style={{ ...inputStyle, textAlign: 'right' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-700)', display: 'block', marginBottom: '4px' }}>Motivo</label>
                  <select value={newReason} onChange={(e) => setNewReason(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    {Object.entries(REASON_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-700)', display: 'block', marginBottom: '4px' }}>Observacao</label>
                  <textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Opcional" style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }} />
                </div>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: isMobile ? 'column-reverse' : 'row',
                justifyContent: isMobile ? 'stretch' : 'flex-end',
                gap: '12px', marginTop: '20px',
              }}>
                <button onClick={() => setShowModal(false)} style={{
                  padding: '10px 16px', fontSize: 'var(--font-sm)', fontWeight: 500,
                  color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)',
                  border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  minHeight: '44px', width: isMobile ? '100%' : 'auto',
                }}>Cancelar</button>
                <button onClick={handleSave} disabled={saving || !newProductId || !newQty} style={{
                  padding: '10px 16px', fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--color-white)',
                  backgroundColor: 'var(--color-primary-600)', border: 'none', borderRadius: 'var(--radius-md)',
                  cursor: (saving || !newProductId || !newQty) ? 'not-allowed' : 'pointer',
                  opacity: (saving || !newProductId || !newQty) ? 0.5 : 1,
                  minHeight: '44px', width: isMobile ? '100%' : 'auto',
                }}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
