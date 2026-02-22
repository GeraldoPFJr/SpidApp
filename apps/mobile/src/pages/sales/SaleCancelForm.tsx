import { type CSSProperties, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApiMutation } from '../../hooks/useApi'

const GOODS_OPTIONS = [
  { value: 'returned', label: 'Devolvida ao estoque' },
  { value: 'credit', label: 'Credito para o cliente' },
  { value: 'loss', label: 'Perda / estrago' },
  { value: 'other', label: 'Outro' },
]

const MONEY_OPTIONS = [
  { value: 'refunded', label: 'Devolvido ao cliente' },
  { value: 'credit', label: 'Credito para o cliente' },
  { value: 'card_reversal', label: 'Estorno em cartao' },
  { value: 'other', label: 'Outro' },
]

export function SaleCancelFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { execute, loading, error: apiError } = useApiMutation(`/sales/${id}/cancel`)

  const [goodsAction, setGoodsAction] = useState('')
  const [moneyAction, setMoneyAction] = useState('')
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!goodsAction) errs.goods = 'Selecione o destino da mercadoria'
    if (!moneyAction) errs.money = 'Selecione o destino do dinheiro'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    const result = await execute({
      goodsAction,
      moneyAction,
      notes: notes.trim() || null,
    })
    if (!result) {
      return
    }
    navigate(`/vendas/${id}`, { replace: true })
  }

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
    gap: 'var(--sp-3)',
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const radioGroupStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--sp-2)',
  }

  const radioStyle = (selected: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--sp-3)',
    padding: 'var(--sp-3) var(--sp-4)',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${selected ? 'var(--primary)' : 'var(--neutral-300)'}`,
    backgroundColor: selected ? 'var(--primary-50)' : 'var(--surface)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    minHeight: '48px',
  })

  const radioCircleStyle = (selected: boolean): CSSProperties => ({
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    border: `2px solid ${selected ? 'var(--primary)' : 'var(--neutral-300)'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all var(--transition-fast)',
  })

  const radioInnerStyle: CSSProperties = {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
  }

  const errorMsgStyle: CSSProperties = {
    fontSize: 'var(--font-xs)',
    color: 'var(--danger-600)',
  }

  return (
    <div style={pageStyle} className="animate-fade-in">
      <div className="alert alert-danger" style={{ marginBottom: 0 }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>Esta acao e irreversivel. Preencha o questionario abaixo.</span>
      </div>

      {/* Mercadoria */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>O que foi feito com a mercadoria?</span>
        {errors.goods && <span style={errorMsgStyle}>{errors.goods}</span>}
        <div style={radioGroupStyle}>
          {GOODS_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              style={radioStyle(goodsAction === opt.value)}
              onClick={() => {
                setGoodsAction(opt.value)
                if (errors.goods) setErrors((p) => { const n = { ...p }; delete n.goods; return n })
              }}
            >
              <div style={radioCircleStyle(goodsAction === opt.value)}>
                {goodsAction === opt.value && <div style={radioInnerStyle} />}
              </div>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                {opt.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Dinheiro */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>O que foi feito com o dinheiro?</span>
        {errors.money && <span style={errorMsgStyle}>{errors.money}</span>}
        <div style={radioGroupStyle}>
          {MONEY_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              style={radioStyle(moneyAction === opt.value)}
              onClick={() => {
                setMoneyAction(opt.value)
                if (errors.money) setErrors((p) => { const n = { ...p }; delete n.money; return n })
              }}
            >
              <div style={radioCircleStyle(moneyAction === opt.value)}>
                {moneyAction === opt.value && <div style={radioInnerStyle} />}
              </div>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                {opt.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Observacoes */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Observacoes</span>
        <textarea
          className="form-textarea"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Observacoes adicionais sobre o cancelamento..."
          rows={3}
        />
      </div>

      {apiError && (
        <div className="alert alert-danger" style={{ marginBottom: 0 }}>
          <span>{apiError}</span>
        </div>
      )}

      <button
        className="btn btn-danger btn-lg btn-block"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Cancelando...' : 'Confirmar Cancelamento'}
      </button>
    </div>
  )
}
