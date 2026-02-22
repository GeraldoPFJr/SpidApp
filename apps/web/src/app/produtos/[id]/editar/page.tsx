'use client'

import { type CSSProperties, useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/lib/api'
import type { Category, Subcategory } from '@spid/shared'

interface UnitRow {
  id: string
  nameLabel: string
  factorToBase: number
  isSellable: boolean
  sortOrder: number
}

interface PriceRow {
  unitId: string
  unitLabel: string
  tierId: string
  tierName: string
  price: string
}

interface PriceTierData {
  id: string
  name: string
  isDefault: boolean
}

interface ExistingProduct {
  id: string
  name: string
  code: string | null
  categoryId: string
  subcategoryId: string | null
  minStock: number | null
  active: boolean
  units: Array<{
    id: string
    nameLabel: string
    factorToBase: number
    isSellable: boolean
    sortOrder: number
  }>
  prices: Array<{
    id: string
    unitId: string
    tierId: string
    price: number
  }>
}

export default function EditarProdutoPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { data: product, loading: loadingProduct } = useApi<ExistingProduct>(`/products/${id}`)
  const { data: categories } = useApi<Category[]>('/categories')
  const { data: subcategories } = useApi<Subcategory[]>('/subcategories')
  const { data: priceTiers } = useApi<PriceTierData[]>('/price-tiers')

  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [minStock, setMinStock] = useState('')
  const [active, setActive] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [initialized, setInitialized] = useState(false)

  const [units, setUnits] = useState<UnitRow[]>([])
  const [prices, setPrices] = useState<PriceRow[]>([])

  // Load existing product data into form
  useEffect(() => {
    if (!product || initialized) return
    setName(product.name)
    setCode(product.code ?? '')
    setCategoryId(product.categoryId)
    setSubcategoryId(product.subcategoryId ?? '')
    setMinStock(product.minStock?.toString() ?? '')
    setActive(product.active)
    setUnits(product.units.map((u) => ({
      id: u.id,
      nameLabel: u.nameLabel,
      factorToBase: u.factorToBase,
      isSellable: u.isSellable,
      sortOrder: u.sortOrder,
    })))
    setInitialized(true)
  }, [product, initialized])

  // Rebuild prices when units or tiers change (after initialization)
  useEffect(() => {
    if (!priceTiers?.length || !initialized) return
    const newPrices: PriceRow[] = []
    for (const unit of units.filter((u) => u.isSellable)) {
      for (const tier of priceTiers) {
        const existingPrice = product?.prices.find(
          (p) => p.unitId === unit.id && p.tierId === tier.id,
        )
        const currentPrice = prices.find(
          (p) => p.unitId === unit.id && p.tierId === tier.id,
        )
        newPrices.push({
          unitId: unit.id,
          unitLabel: unit.nameLabel,
          tierId: tier.id,
          tierName: tier.name,
          price: currentPrice?.price ?? (existingPrice ? String(existingPrice.price) : ''),
        })
      }
    }
    setPrices(newPrices)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [units, priceTiers, initialized])

  const filteredSubcategories = subcategories?.filter((s) => s.categoryId === categoryId) ?? []

  const addUnit = useCallback(() => {
    setUnits((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nameLabel: '', factorToBase: 1, isSellable: true, sortOrder: prev.length },
    ])
  }, [])

  const removeUnit = useCallback((uid: string) => {
    setUnits((prev) => prev.filter((u) => u.id !== uid))
  }, [])

  const updateUnit = useCallback((uid: string, field: keyof UnitRow, value: string | number | boolean) => {
    setUnits((prev) => prev.map((u) => (u.id === uid ? { ...u, [field]: value } : u)))
  }, [])

  const updatePrice = useCallback((unitId: string, tierId: string, value: string) => {
    setPrices((prev) =>
      prev.map((p) => (p.unitId === unitId && p.tierId === tierId ? { ...p, price: value } : p)),
    )
  }, [])

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Nome e obrigatorio'
    if (!categoryId) errs.categoryId = 'Categoria e obrigatoria'
    if (units.length === 0) errs.units = 'Pelo menos uma unidade e necessaria'
    if (units.some((u) => !u.nameLabel.trim())) errs.units = 'Todas as unidades precisam de nome'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [name, categoryId, units])

  const handleSubmit = useCallback(async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await apiClient(`/products/${id}`, {
        method: 'PUT',
        body: {
          id,
          name: name.trim(),
          code: code.trim() || null,
          categoryId,
          subcategoryId: subcategoryId || null,
          minStock: minStock ? parseInt(minStock, 10) : null,
          active,
          units: units.map((u) => ({
            id: u.id,
            nameLabel: u.nameLabel,
            factorToBase: u.factorToBase,
            isSellable: u.isSellable,
            sortOrder: u.sortOrder,
          })),
          prices: prices
            .filter((p) => p.price)
            .map((p) => ({
              unitId: p.unitId,
              tierId: p.tierId,
              price: parseFloat(p.price.replace(',', '.')),
            })),
        },
      })
      router.push(`/produtos/${id}`)
    } catch {
      setErrors({ submit: 'Erro ao salvar produto. Tente novamente.' })
    } finally {
      setSaving(false)
    }
  }, [validate, id, name, code, categoryId, subcategoryId, minStock, active, units, prices, router])

  // ─── Styles ──────────────────────────────────────

  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: '24px',
    boxShadow: 'var(--shadow-sm)',
  }

  const inputStyle = (hasError: boolean = false): CSSProperties => ({
    width: '100%',
    padding: '8px 12px',
    fontSize: 'var(--font-base)',
    color: 'var(--color-neutral-800)',
    backgroundColor: 'var(--color-white)',
    border: `1px solid ${hasError ? 'var(--color-danger-500)' : 'var(--color-neutral-300)'}`,
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    transition: 'border-color var(--transition-fast)',
  })

  const selectStyle: CSSProperties = {
    ...inputStyle(),
    cursor: 'pointer',
  }

  const labelStyle: CSSProperties = {
    fontSize: 'var(--font-sm)',
    fontWeight: 500,
    color: 'var(--color-neutral-700)',
    marginBottom: '4px',
    display: 'block',
  }

  const errorMsgStyle: CSSProperties = {
    fontSize: 'var(--font-xs)',
    color: 'var(--color-danger-600)',
    marginTop: '4px',
  }

  const miniTableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 'var(--font-sm)',
  }

  const miniThStyle: CSSProperties = {
    padding: '8px 12px',
    textAlign: 'left',
    fontWeight: 500,
    color: 'var(--color-neutral-500)',
    borderBottom: '1px solid var(--color-border)',
    fontSize: 'var(--font-xs)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  }

  const miniTdStyle: CSSProperties = {
    padding: '8px 12px',
    borderBottom: '1px solid var(--color-neutral-100)',
    verticalAlign: 'middle',
  }

  const miniInputStyle: CSSProperties = {
    padding: '6px 10px',
    fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-800)',
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-neutral-300)',
    borderRadius: 'var(--radius-sm)',
    outline: 'none',
    width: '100%',
  }

  const smallBtnStyle = (variant: 'danger' | 'secondary'): CSSProperties => ({
    padding: '4px 10px',
    fontSize: 'var(--font-xs)',
    fontWeight: 500,
    color: variant === 'danger' ? 'var(--color-danger-600)' : 'var(--color-neutral-600)',
    backgroundColor: 'var(--color-white)',
    border: `1px solid ${variant === 'danger' ? 'var(--color-danger-200)' : 'var(--color-neutral-300)'}`,
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  })

  if (loadingProduct) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '960px' }}>
          <div className="skeleton" style={{ height: '32px', width: '300px' }} />
          <div className="skeleton skeleton-card" style={{ height: '300px' }} />
          <div className="skeleton skeleton-card" style={{ height: '200px' }} />
        </div>
      </Layout>
    )
  }

  if (!product) {
    return (
      <Layout>
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-neutral-500)' }}>
          Produto nao encontrado
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '960px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.back()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)',
              cursor: 'pointer', transition: 'all var(--transition-fast)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>
              Editar Produto
            </h1>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', margin: '2px 0 0' }}>
              {product.name}
            </p>
          </div>
        </div>

        {errors.submit && (
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-danger-50)', border: '1px solid var(--color-danger-100)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-700)', fontSize: 'var(--font-sm)' }}>
            {errors.submit}
          </div>
        )}

        {/* Basic Info */}
        <div style={cardStyle}>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 20px' }}>
            Informacoes Basicas
          </h2>
          <div className="form-grid-2">
            <div>
              <label style={labelStyle}>Nome *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Ovo Branco"
                style={inputStyle(!!errors.name)}
              />
              {errors.name && <p style={errorMsgStyle}>{errors.name}</p>}
            </div>
            <div>
              <label style={labelStyle}>Codigo</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex: OVO001"
                style={inputStyle()}
              />
            </div>
            <div>
              <label style={labelStyle}>Categoria *</label>
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value)
                  setSubcategoryId('')
                }}
                style={selectStyle}
              >
                <option value="">Selecione...</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {errors.categoryId && <p style={errorMsgStyle}>{errors.categoryId}</p>}
            </div>
            <div>
              <label style={labelStyle}>Subcategoria</label>
              <select
                value={subcategoryId}
                onChange={(e) => setSubcategoryId(e.target.value)}
                style={selectStyle}
                disabled={!categoryId}
              >
                <option value="">Selecione...</option>
                {filteredSubcategories.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Estoque Minimo</label>
              <input
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                placeholder="0"
                min="0"
                style={inputStyle()}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--font-sm)', color: 'var(--color-neutral-700)' }}>
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary-600)' }}
                />
                Produto ativo
              </label>
            </div>
          </div>
        </div>

        {/* Units */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: 0 }}>
              Unidades Vendaveis
            </h2>
            <button onClick={addUnit} style={smallBtnStyle('secondary')}>
              + Adicionar Unidade
            </button>
          </div>
          {errors.units && <p style={{ ...errorMsgStyle, marginBottom: '12px' }}>{errors.units}</p>}
          <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <table style={miniTableStyle}>
              <thead>
                <tr>
                  <th style={miniThStyle}>Nome</th>
                  <th style={{ ...miniThStyle, width: '120px' }}>Fator p/ Base</th>
                  <th style={{ ...miniThStyle, width: '90px', textAlign: 'center' }}>Vendavel</th>
                  <th style={{ ...miniThStyle, width: '80px', textAlign: 'center' }}>Ordem</th>
                  <th style={{ ...miniThStyle, width: '60px' }} />
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id}>
                    <td style={miniTdStyle}>
                      <input
                        type="text"
                        value={unit.nameLabel}
                        onChange={(e) => updateUnit(unit.id, 'nameLabel', e.target.value)}
                        placeholder="Ex: Bandeja"
                        style={miniInputStyle}
                      />
                    </td>
                    <td style={miniTdStyle}>
                      <input
                        type="number"
                        value={unit.factorToBase}
                        onChange={(e) => updateUnit(unit.id, 'factorToBase', parseInt(e.target.value, 10) || 1)}
                        min="1"
                        style={{ ...miniInputStyle, textAlign: 'right' }}
                      />
                    </td>
                    <td style={{ ...miniTdStyle, textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={unit.isSellable}
                        onChange={(e) => updateUnit(unit.id, 'isSellable', e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-primary-600)' }}
                      />
                    </td>
                    <td style={{ ...miniTdStyle, textAlign: 'center' }}>
                      <input
                        type="number"
                        value={unit.sortOrder}
                        onChange={(e) => updateUnit(unit.id, 'sortOrder', parseInt(e.target.value, 10) || 0)}
                        min="0"
                        style={{ ...miniInputStyle, textAlign: 'center', width: '60px' }}
                      />
                    </td>
                    <td style={{ ...miniTdStyle, textAlign: 'center' }}>
                      {units.length > 1 && (
                        <button onClick={() => removeUnit(unit.id)} style={smallBtnStyle('danger')} title="Remover">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Prices */}
        {prices.length > 0 && (
          <div style={cardStyle}>
            <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 16px' }}>
              Precos
            </h2>
            <div style={{ overflowX: 'auto', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <table style={miniTableStyle}>
                <thead>
                  <tr>
                    <th style={miniThStyle}>Unidade</th>
                    <th style={miniThStyle}>Tabela</th>
                    <th style={{ ...miniThStyle, width: '160px' }}>Preco (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.map((p) => (
                    <tr key={`${p.unitId}-${p.tierId}`}>
                      <td style={miniTdStyle}>{p.unitLabel}</td>
                      <td style={miniTdStyle}>{p.tierName}</td>
                      <td style={miniTdStyle}>
                        <input
                          type="text"
                          value={p.price}
                          onChange={(e) => updatePrice(p.unitId, p.tierId, e.target.value)}
                          placeholder="0,00"
                          style={{ ...miniInputStyle, textAlign: 'right' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="form-actions">
          <button
            onClick={() => router.back()}
            style={{
              padding: '10px 20px', fontSize: 'var(--font-sm)', fontWeight: 500,
              color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)',
              border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', transition: 'all var(--transition-fast)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: '10px 24px', fontSize: 'var(--font-sm)', fontWeight: 600,
              color: 'var(--color-white)', backgroundColor: 'var(--color-primary-600)',
              border: 'none', borderRadius: 'var(--radius-md)',
              cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
              transition: 'all var(--transition-fast)',
            }}
          >
            {saving ? 'Salvando...' : 'Salvar Alteracoes'}
          </button>
        </div>
      </div>
    </Layout>
  )
}
