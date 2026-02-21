import { type CSSProperties, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApi, useApiMutation } from '../../hooks/useApi'

interface CustomerFormData {
  name: string
  phone: string
  doc: string
  address: string
  notes: string
  type: 'PF' | 'PJ'
}

export function CustomerFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { data: existing } = useApi<any>(id ? `/customers/${id}` : null)
  const { execute, loading: saving } = useApiMutation(id ? `/customers/${id}` : '/customers')

  const [form, setForm] = useState<CustomerFormData>({
    name: '',
    phone: '',
    doc: '',
    address: '',
    notes: '',
    type: 'PF',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name ?? '',
        phone: existing.phone ?? '',
        doc: existing.doc ?? '',
        address: existing.address ?? '',
        notes: existing.notes ?? '',
        type: existing.doc && existing.doc.length > 14 ? 'PJ' : 'PF',
      })
    }
  }, [existing])

  function updateField(field: keyof CustomerFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => { const n = { ...prev }; delete n[field]; return n })
    }
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Nome e obrigatorio'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim() || null,
      doc: form.doc.trim() || null,
      address: form.address.trim() || null,
      notes: form.notes.trim() || null,
    }
    const result = await execute(payload, isEdit ? 'PUT' : 'POST')
    if (result) {
      navigate(isEdit ? `/clientes/${id}` : '/clientes', { replace: true })
    }
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

  const labelStyle: CSSProperties = {
    fontSize: 'var(--font-sm)',
    fontWeight: 500,
    color: 'var(--neutral-700)',
    marginBottom: 'var(--sp-1)',
    display: 'block',
  }

  const inputStyle = (hasError: boolean): CSSProperties => ({
    width: '100%',
    padding: 'var(--sp-2) var(--sp-3)',
    fontSize: 'var(--font-base)',
    border: `1px solid ${hasError ? 'var(--danger-500)' : 'var(--neutral-300)'}`,
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    backgroundColor: 'var(--surface)',
    minHeight: '44px',
    transition: 'border-color var(--transition-fast)',
  })

  const errorMsgStyle: CSSProperties = {
    fontSize: 'var(--font-xs)',
    color: 'var(--danger-600)',
    marginTop: '2px',
  }

  const typeToggleStyle: CSSProperties = {
    display: 'flex',
    gap: 'var(--sp-2)',
  }

  const typeOptionStyle = (active: boolean): CSSProperties => ({
    flex: 1,
    padding: 'var(--sp-2) var(--sp-3)',
    border: `1px solid ${active ? 'var(--primary)' : 'var(--neutral-300)'}`,
    borderRadius: 'var(--radius-md)',
    backgroundColor: active ? 'var(--primary-50)' : 'var(--surface)',
    color: active ? 'var(--primary-700)' : 'var(--text-secondary)',
    fontWeight: 500,
    fontSize: 'var(--font-sm)',
    cursor: 'pointer',
    textAlign: 'center' as const,
    transition: 'all var(--transition-fast)',
    minHeight: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  return (
    <div style={pageStyle} className="animate-fade-in">
      <div style={sectionStyle}>
        <div>
          <label style={labelStyle}>Tipo</label>
          <div style={typeToggleStyle}>
            <button style={typeOptionStyle(form.type === 'PF')} onClick={() => updateField('type', 'PF')}>
              Pessoa Fisica
            </button>
            <button style={typeOptionStyle(form.type === 'PJ')} onClick={() => updateField('type', 'PJ')}>
              Pessoa Juridica
            </button>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Nome *</label>
          <input
            style={inputStyle(!!errors.name)}
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder={form.type === 'PJ' ? 'Razao Social' : 'Nome completo'}
          />
          {errors.name && <span style={errorMsgStyle}>{errors.name}</span>}
        </div>

        <div>
          <label style={labelStyle}>Telefone</label>
          <input
            type="tel"
            style={inputStyle(false)}
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="(00) 00000-0000"
            inputMode="tel"
          />
        </div>

        <div>
          <label style={labelStyle}>{form.type === 'PJ' ? 'CNPJ' : 'CPF'}</label>
          <input
            style={inputStyle(false)}
            value={form.doc}
            onChange={(e) => updateField('doc', e.target.value)}
            placeholder={form.type === 'PJ' ? '00.000.000/0000-00' : '000.000.000-00'}
            inputMode="numeric"
          />
        </div>

        <div>
          <label style={labelStyle}>Endereco</label>
          <input
            style={inputStyle(false)}
            value={form.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Rua, numero, bairro, cidade"
          />
        </div>

        <div>
          <label style={labelStyle}>Observacoes</label>
          <textarea
            className="form-textarea"
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Observacoes sobre o cliente..."
            rows={3}
          />
        </div>
      </div>

      <button
        className="btn btn-primary btn-lg btn-block"
        onClick={handleSubmit}
        disabled={saving}
      >
        {saving ? 'Salvando...' : isEdit ? 'Salvar Alteracoes' : 'Cadastrar Cliente'}
      </button>
    </div>
  )
}
