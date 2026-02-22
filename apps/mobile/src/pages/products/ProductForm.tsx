import { type CSSProperties, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApi, useApiMutation } from '../../hooks/useApi'
import type { Category, Subcategory, PriceTier } from '@spid/shared'

interface UnitRow {
  id?: string
  nameLabel: string
  factorToBase: number
}

interface PriceRow {
  unitIndex: number
  tierId: string
  price: string
}

interface ProductFormData {
  name: string
  code: string
  categoryId: string
  subcategoryId: string
  minStock: string
  active: boolean
  units: UnitRow[]
  prices: PriceRow[]
}

const INITIAL_UNITS: UnitRow[] = [
  { nameLabel: 'Bandeja', factorToBase: 12 },
  { nameLabel: 'Cartela', factorToBase: 30 },
  { nameLabel: 'Caixa', factorToBase: 360 },
]

export function ProductFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const { data: categories } = useApi<Category[]>('/categories')
  const { data: subcategories } = useApi<Subcategory[]>('/subcategories')
  const { data: tiers } = useApi<PriceTier[]>('/price-tiers')
  const { data: existing } = useApi<Record<string, unknown>>(id ? `/products/${id}` : null)
  const { execute, loading: saving, error: apiError } = useApiMutation(id ? `/products/${id}` : '/products')

  const [form, setForm] = useState<ProductFormData>({
    name: '',
    code: '',
    categoryId: '',
    subcategoryId: '',
    minStock: '',
    active: true,
    units: [...INITIAL_UNITS],
    prices: [],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (existing) {
      const rawUnits = existing.units as Array<{ id: string; nameLabel: string; factorToBase: number }> | undefined
      const rawPrices = existing.prices as PriceRow[] | undefined
      setForm({
        name: String(existing.name ?? ''),
        code: String(existing.code ?? ''),
        categoryId: String(existing.categoryId ?? ''),
        subcategoryId: String(existing.subcategoryId ?? ''),
        minStock: existing.minStock != null ? String(existing.minStock) : '',
        active: (existing.active as boolean) ?? true,
        units: rawUnits && rawUnits.length > 0
          ? rawUnits.map((u) => ({
              id: u.id,
              nameLabel: u.nameLabel ?? '',
              factorToBase: u.factorToBase ?? 1,
            }))
          : [...INITIAL_UNITS],
        prices: rawPrices ?? [],
      })
    }
  }, [existing])

  const filteredSubcategories = subcategories?.filter(
    (s) => s.categoryId === form.categoryId
  ) ?? []

  function updateField(field: keyof ProductFormData, value: string | boolean | UnitRow[] | PriceRow[]) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  function updateUnit(index: number, field: keyof UnitRow, value: string | number) {
    setForm((prev) => {
      const units = [...prev.units]
      const current = units[index]
      if (!current) return prev
      units[index] = { ...current, [field]: value }
      return { ...prev, units }
    })
  }

  function addUnit() {
    setForm((prev) => ({
      ...prev,
      units: [...prev.units, { nameLabel: '', factorToBase: 1 }],
    }))
  }

  function removeUnit(index: number) {
    setForm((prev) => ({
      ...prev,
      units: prev.units.filter((_, i) => i !== index),
    }))
  }

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Nome e obrigatorio'
    if (!form.categoryId) errs.categoryId = 'Categoria e obrigatoria'
    for (let i = 0; i < form.units.length; i++) {
      const unit = form.units[i]
      if (!unit) continue
      if (!unit.nameLabel.trim()) errs[`unit_${i}_name`] = 'Nome da unidade e obrigatorio'
      if (unit.factorToBase < 1) errs[`unit_${i}_factor`] = 'Fator deve ser >= 1'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    const payload = {
      name: form.name.trim(),
      code: form.code.trim() || null,
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId || null,
      minStock: form.minStock ? parseInt(form.minStock, 10) : null,
      active: form.active,
      units: form.units.map((u, idx) => ({
        id: u.id,
        nameLabel: u.nameLabel.trim(),
        factorToBase: Number(u.factorToBase),
        isSellable: true,
        sortOrder: idx,
      })),
      prices: form.prices.filter((p) => p.price !== '').map((p) => ({
        unitId: p.unitIndex !== undefined ? (form.units[p.unitIndex]?.id ?? '') : '',
        tierId: p.tierId,
        price: parseFloat(p.price) || 0,
      })),
    }
    const result = await execute(payload, isEdit ? 'PUT' : 'POST')
    if (!result) {
      return
    }
    navigate(isEdit ? `/produtos/${id}` : '/produtos', { replace: true })
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

  const selectStyle = (hasError: boolean): CSSProperties => ({
    ...inputStyle(hasError),
    cursor: 'pointer',
  })

  const errorMsgStyle: CSSProperties = {
    fontSize: 'var(--font-xs)',
    color: 'var(--danger-600)',
    marginTop: '2px',
  }

  const unitRowStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 80px 40px',
    gap: 'var(--sp-2)',
    alignItems: 'start',
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  return (
    <div style={pageStyle} className="animate-fade-in">
      {/* Dados Basicos */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Dados do Produto</span>

        <div>
          <label style={labelStyle}>Nome *</label>
          <input
            style={inputStyle(!!errors.name)}
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Ex: Ovo Branco Grande"
          />
          {errors.name && <span style={errorMsgStyle}>{errors.name}</span>}
        </div>

        <div>
          <label style={labelStyle}>Codigo</label>
          <input
            style={inputStyle(false)}
            value={form.code}
            onChange={(e) => updateField('code', e.target.value)}
            placeholder="Opcional"
          />
        </div>

        <div className="form-row">
          <div>
            <label style={labelStyle}>Categoria *</label>
            <select
              style={selectStyle(!!errors.categoryId)}
              value={form.categoryId}
              onChange={(e) => {
                updateField('categoryId', e.target.value)
                updateField('subcategoryId', '')
              }}
            >
              <option value="">Selecione</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {errors.categoryId && <span style={errorMsgStyle}>{errors.categoryId}</span>}
          </div>
          <div>
            <label style={labelStyle}>Subcategoria</label>
            <select
              style={selectStyle(false)}
              value={form.subcategoryId}
              onChange={(e) => updateField('subcategoryId', e.target.value)}
              disabled={!form.categoryId}
            >
              <option value="">Nenhuma</option>
              {filteredSubcategories.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div>
            <label style={labelStyle}>Estoque Minimo</label>
            <input
              type="number"
              style={inputStyle(false)}
              value={form.minStock}
              onChange={(e) => updateField('minStock', e.target.value)}
              placeholder="0"
              inputMode="numeric"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', paddingTop: 'var(--sp-6)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => updateField('active', e.target.checked)}
                style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--text-primary)' }}>
                Ativo
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Unidades Vendaveis */}
      <div style={sectionStyle}>
        <span style={sectionTitleStyle}>Unidades Vendaveis</span>
        <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '-var(--sp-2)' }}>
          Define como o produto pode ser vendido. Fator = quantidade da unidade base.
        </p>

        {form.units.map((unit, index) => (
          <div key={index} style={unitRowStyle}>
            <div>
              <input
                style={inputStyle(!!errors[`unit_${index}_name`])}
                value={unit.nameLabel}
                onChange={(e) => updateUnit(index, 'nameLabel', e.target.value)}
                placeholder="Ex: Bandeja"
              />
              {errors[`unit_${index}_name`] && (
                <span style={errorMsgStyle}>{errors[`unit_${index}_name`]}</span>
              )}
            </div>
            <div>
              <input
                type="number"
                style={inputStyle(!!errors[`unit_${index}_factor`])}
                value={unit.factorToBase}
                onChange={(e) => updateUnit(index, 'factorToBase', parseInt(e.target.value, 10) || 0)}
                inputMode="numeric"
                min={1}
              />
            </div>
            <button
              type="button"
              style={{
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                color: 'var(--danger-500)',
                cursor: 'pointer',
                padding: 'var(--sp-2)',
                borderRadius: 'var(--radius-md)',
              }}
              onClick={() => removeUnit(index)}
              aria-label="Remover unidade"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        ))}

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={addUnit}
          style={{ alignSelf: 'flex-start' }}
        >
          + Adicionar Unidade
        </button>
      </div>

      {/* Precos (simplificado - por unidade x tabela) */}
      {tiers && tiers.length > 0 && form.units.length > 0 && (
        <div style={sectionStyle}>
          <span style={sectionTitleStyle}>Precos</span>
          {form.units.map((unit, unitIdx) => (
            <div key={unitIdx} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                {unit.nameLabel || `Unidade ${unitIdx + 1}`}
              </span>
              <div className="grid-2">
                {tiers.map((tier) => {
                  const priceIdx = form.prices.findIndex(
                    (p) => p.unitIndex === unitIdx && p.tierId === tier.id
                  )
                  const priceValue = priceIdx >= 0 ? (form.prices[priceIdx]?.price ?? '') : ''
                  return (
                    <div key={tier.id}>
                      <label style={{ ...labelStyle, fontSize: 'var(--font-xs)' }}>
                        {tier.name}
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        style={inputStyle(false)}
                        value={priceValue}
                        onChange={(e) => {
                          setForm((prev) => {
                            const prices = [...prev.prices]
                            const existing = prices.findIndex(
                              (p) => p.unitIndex === unitIdx && p.tierId === tier.id
                            )
                            if (existing >= 0 && prices[existing]) {
                              prices[existing] = { ...prices[existing], price: e.target.value }
                            } else if (existing < 0) {
                              prices.push({ unitIndex: unitIdx, tierId: tier.id, price: e.target.value })
                            }
                            return { ...prev, prices }
                          })
                        }}
                        placeholder="R$ 0,00"
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Erro API */}
      {apiError && (
        <div className="alert alert-danger" style={{ marginBottom: 0 }}>
          <span>{apiError}</span>
        </div>
      )}

      {/* Botao Salvar */}
      <button
        className="btn btn-primary btn-lg btn-block"
        onClick={handleSubmit}
        disabled={saving}
      >
        {saving ? 'Salvando...' : isEdit ? 'Salvar Alteracoes' : 'Cadastrar Produto'}
      </button>
    </div>
  )
}
