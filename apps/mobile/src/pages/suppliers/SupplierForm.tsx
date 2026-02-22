import { type CSSProperties, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApi, useApiMutation } from '../../hooks/useApi'

interface SupplierFormData {
  name: string
  phone: string
  cnpj: string
  city: string
  productTypes: string
  minOrder: string
  paymentTerms: string
  notes: string
}

export function SupplierFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { data: existing } = useApi<SupplierFormData & { id: string }>(id ? `/suppliers/${id}` : null)
  const { execute, loading: saving, error: apiError } = useApiMutation(id ? `/suppliers/${id}` : '/suppliers')

  const [form, setForm] = useState<SupplierFormData>({
    name: '',
    phone: '',
    cnpj: '',
    city: '',
    productTypes: '',
    minOrder: '',
    paymentTerms: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name ?? '',
        phone: existing.phone ?? '',
        cnpj: existing.cnpj ?? '',
        city: existing.city ?? '',
        productTypes: existing.productTypes ?? '',
        minOrder: existing.minOrder ?? '',
        paymentTerms: existing.paymentTerms ?? '',
        notes: existing.notes ?? '',
      })
    }
  }, [existing])

  function updateField(field: keyof SupplierFormData, value: string) {
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
      cnpj: form.cnpj.trim() || null,
      city: form.city.trim() || null,
      productTypes: form.productTypes.trim() || null,
      minOrder: form.minOrder.trim() || null,
      paymentTerms: form.paymentTerms.trim() || null,
      notes: form.notes.trim() || null,
    }
    const result = await execute(payload, isEdit ? 'PUT' : 'POST')
    if (!result) {
      return
    }
    navigate('/fornecedores', { replace: true })
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

  return (
    <div style={pageStyle} className="animate-fade-in">
      <div style={sectionStyle}>
        <div>
          <label style={labelStyle}>Nome *</label>
          <input
            style={inputStyle(!!errors.name)}
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Nome do fornecedor"
          />
          {errors.name && <span style={errorMsgStyle}>{errors.name}</span>}
        </div>

        <div className="form-row">
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
            <label style={labelStyle}>CNPJ</label>
            <input
              style={inputStyle(false)}
              value={form.cnpj}
              onChange={(e) => updateField('cnpj', e.target.value)}
              placeholder="00.000.000/0000-00"
              inputMode="numeric"
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Cidade</label>
          <input
            style={inputStyle(false)}
            value={form.city}
            onChange={(e) => updateField('city', e.target.value)}
            placeholder="Cidade do fornecedor"
          />
        </div>

        <div>
          <label style={labelStyle}>Tipo de Produtos</label>
          <input
            style={inputStyle(false)}
            value={form.productTypes}
            onChange={(e) => updateField('productTypes', e.target.value)}
            placeholder="Ex: Ovos, Mercearia, Bebidas"
          />
        </div>

        <div className="form-row">
          <div>
            <label style={labelStyle}>Pedido Minimo</label>
            <input
              style={inputStyle(false)}
              value={form.minOrder}
              onChange={(e) => updateField('minOrder', e.target.value)}
              placeholder="Ex: R$ 500,00"
            />
          </div>
          <div>
            <label style={labelStyle}>Forma de Pagamento</label>
            <input
              style={inputStyle(false)}
              value={form.paymentTerms}
              onChange={(e) => updateField('paymentTerms', e.target.value)}
              placeholder="Ex: Boleto 30 dias"
            />
          </div>
        </div>

        <div>
          <label style={labelStyle}>Observacoes</label>
          <textarea
            className="form-textarea"
            value={form.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Observacoes sobre o fornecedor..."
            rows={3}
          />
        </div>
      </div>

      {apiError && (
        <div className="alert alert-danger" style={{ marginBottom: 0 }}>
          <span>{apiError}</span>
        </div>
      )}

      <button
        className="btn btn-primary btn-lg btn-block"
        onClick={handleSubmit}
        disabled={saving}
      >
        {saving ? 'Salvando...' : isEdit ? 'Salvar Alteracoes' : 'Cadastrar Fornecedor'}
      </button>
    </div>
  )
}
