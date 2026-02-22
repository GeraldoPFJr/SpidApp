'use client'

import { type CSSProperties, useCallback, useState } from 'react'
import { Layout } from '@/components/Layout'
import { useApi } from '@/hooks/useApi'
import { apiClient } from '@/lib/api'

// ─── Types ──────────────────────────────────────────────

interface Subcategory {
  id: string
  name: string
  categoryId: string
}

interface Category {
  id: string
  name: string
  subcategories: Subcategory[]
}

interface FinanceCategory {
  id: string
  name: string
  type: 'EXPENSE' | 'INCOME'
}

// ─── Component ──────────────────────────────────────────

export default function CategoriasPage() {
  const [activeTab, setActiveTab] = useState<'products' | 'finance'>('products')

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>
            Categorias
          </h1>
          <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', margin: '4px 0 0' }}>
            Gerencie categorias de produtos e categorias financeiras
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setActiveTab('products')} style={tabStyle(activeTab === 'products')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Produtos
          </button>
          <button onClick={() => setActiveTab('finance')} style={tabStyle(activeTab === 'finance')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Financeiro
          </button>
        </div>

        {/* Content */}
        {activeTab === 'products' ? <ProductCategories /> : <FinanceCategories />}
      </div>
    </Layout>
  )
}

// ─── Tab Style ──────────────────────────────────────────

function tabStyle(active: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 24px',
    fontSize: 'var(--font-sm)',
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--color-primary-700)' : 'var(--color-neutral-600)',
    backgroundColor: active ? 'var(--color-primary-50)' : 'var(--color-white)',
    border: `1px solid ${active ? 'var(--color-primary-300)' : 'var(--color-neutral-300)'}`,
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  }
}

// ─── Shared Styles ──────────────────────────────────────

const cardStyle: CSSProperties = {
  backgroundColor: 'var(--color-white)',
  borderRadius: 'var(--radius-lg)',
  border: '1px solid var(--color-border)',
  padding: '24px',
  boxShadow: 'var(--shadow-sm)',
}

const inputStyle: CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: 'var(--font-base)',
  color: 'var(--color-neutral-800)',
  backgroundColor: 'var(--color-white)',
  border: '1px solid var(--color-neutral-300)',
  borderRadius: 'var(--radius-md)',
  outline: 'none',
  transition: 'border-color var(--transition-fast)',
}

const primaryBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 16px',
  fontSize: 'var(--font-sm)',
  fontWeight: 600,
  color: 'var(--color-white)',
  backgroundColor: 'var(--color-primary-600)',
  border: 'none',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
}

const secondaryBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '8px 14px',
  fontSize: 'var(--font-sm)',
  fontWeight: 500,
  color: 'var(--color-neutral-600)',
  backgroundColor: 'var(--color-white)',
  border: '1px solid var(--color-neutral-300)',
  borderRadius: 'var(--radius-md)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
}

const dangerBtnStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '6px',
  color: 'var(--color-danger-500)',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
  transition: 'all var(--transition-fast)',
}

// ─── Product Categories ─────────────────────────────────

function ProductCategories() {
  const { data: categories, loading, refetch } = useApi<Category[]>('/categories')
  const [newCatName, setNewCatName] = useState('')
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editingCatName, setEditingCatName] = useState('')
  const [newSubName, setNewSubName] = useState('')
  const [addingSubToCatId, setAddingSubToCatId] = useState<string | null>(null)
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())

  const toggleExpand = useCallback((id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleAddCategory = useCallback(async () => {
    const name = newCatName.trim()
    if (!name) return
    await apiClient('/categories', { method: 'POST', body: { name } })
    setNewCatName('')
    refetch()
  }, [newCatName, refetch])

  const handleUpdateCategory = useCallback(async (id: string) => {
    const name = editingCatName.trim()
    if (!name) return
    await apiClient(`/categories/${id}`, { method: 'PUT', body: { name } })
    setEditingCatId(null)
    setEditingCatName('')
    refetch()
  }, [editingCatName, refetch])

  const handleDeleteCategory = useCallback(async (id: string) => {
    if (!confirm('Excluir esta categoria e todas as suas subcategorias?')) return
    await apiClient(`/categories/${id}`, { method: 'DELETE' })
    refetch()
  }, [refetch])

  const handleAddSubcategory = useCallback(async (categoryId: string) => {
    const name = newSubName.trim()
    if (!name) return
    await apiClient(`/categories/${categoryId}/subcategories`, { method: 'POST', body: { name } })
    setNewSubName('')
    setAddingSubToCatId(null)
    refetch()
  }, [newSubName, refetch])

  const handleDeleteSubcategory = useCallback(async (id: string) => {
    if (!confirm('Excluir esta subcategoria?')) return
    await apiClient(`/subcategories/${id}`, { method: 'DELETE' })
    refetch()
  }, [refetch])

  if (loading) {
    return (
      <div style={cardStyle}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-text" style={{ height: '48px', marginBottom: '8px', borderRadius: 'var(--radius-md)' }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Add new category */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-900)', margin: '0 0 4px' }}>
          Categorias de Produtos
        </h2>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', margin: '0 0 16px' }}>
          Organize seus produtos em categorias e subcategorias
        </p>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="Nome da nova categoria..."
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={handleAddCategory} disabled={!newCatName.trim()} style={{ ...primaryBtnStyle, opacity: newCatName.trim() ? 1 : 0.5 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Adicionar
          </button>
        </div>

        {/* Category list */}
        {categories && categories.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {categories.map((cat) => {
              const isExpanded = expandedCats.has(cat.id)
              const isEditing = editingCatId === cat.id
              const subCount = cat.subcategories.length

              return (
                <div key={cat.id} style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--color-neutral-200)', overflow: 'hidden' }}>
                  {/* Category row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: isExpanded ? 'var(--color-neutral-50)' : 'var(--color-white)',
                    transition: 'background-color var(--transition-fast)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <button
                        onClick={() => toggleExpand(cat.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--color-neutral-400)', display: 'flex', alignItems: 'center' }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform var(--transition-fast)' }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>

                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                          <input
                            type="text"
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateCategory(cat.id)
                              if (e.key === 'Escape') setEditingCatId(null)
                            }}
                            autoFocus
                            style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: 'var(--font-sm)' }}
                          />
                          <button onClick={() => handleUpdateCategory(cat.id)} style={{ ...primaryBtnStyle, padding: '4px 12px', fontSize: 'var(--font-xs)' }}>Salvar</button>
                          <button onClick={() => setEditingCatId(null)} style={{ ...secondaryBtnStyle, padding: '4px 12px', fontSize: 'var(--font-xs)' }}>Cancelar</button>
                        </div>
                      ) : (
                        <span
                          style={{ fontWeight: 500, color: 'var(--color-neutral-800)', fontSize: 'var(--font-sm)', cursor: 'pointer' }}
                          onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name) }}
                        >
                          {cat.name}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {subCount > 0 && (
                        <span style={{
                          display: 'inline-flex', padding: '2px 8px',
                          fontSize: 'var(--font-xs)', fontWeight: 500,
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)',
                        }}>
                          {subCount} sub
                        </span>
                      )}
                      <button
                        onClick={() => { setAddingSubToCatId(cat.id); setExpandedCats((prev) => new Set(prev).add(cat.id)) }}
                        title="Adicionar subcategoria"
                        style={{ ...secondaryBtnStyle, padding: '4px 8px' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                      </button>
                      <button onClick={() => handleDeleteCategory(cat.id)} title="Excluir categoria" style={dangerBtnStyle}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Subcategories */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--color-neutral-200)', backgroundColor: 'var(--color-neutral-50)' }}>
                      {cat.subcategories.map((sub) => (
                        <div key={sub.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 16px 8px 52px',
                          borderBottom: '1px solid var(--color-neutral-100)',
                        }}>
                          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-600)' }}>
                            {sub.name}
                          </span>
                          <button onClick={() => handleDeleteSubcategory(sub.id)} title="Excluir subcategoria" style={dangerBtnStyle}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}

                      {/* Add subcategory inline */}
                      {addingSubToCatId === cat.id ? (
                        <div style={{ display: 'flex', gap: '8px', padding: '8px 16px 8px 52px' }}>
                          <input
                            type="text"
                            value={newSubName}
                            onChange={(e) => setNewSubName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddSubcategory(cat.id)
                              if (e.key === 'Escape') { setAddingSubToCatId(null); setNewSubName('') }
                            }}
                            autoFocus
                            placeholder="Nome da subcategoria..."
                            style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: 'var(--font-sm)' }}
                          />
                          <button onClick={() => handleAddSubcategory(cat.id)} style={{ ...primaryBtnStyle, padding: '4px 12px', fontSize: 'var(--font-xs)' }}>Salvar</button>
                          <button onClick={() => { setAddingSubToCatId(null); setNewSubName('') }} style={{ ...secondaryBtnStyle, padding: '4px 12px', fontSize: 'var(--font-xs)' }}>Cancelar</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingSubToCatId(cat.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 16px 8px 52px', width: '100%',
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 'var(--font-xs)', color: 'var(--color-primary-600)',
                            transition: 'color var(--transition-fast)',
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                          Adicionar subcategoria
                        </button>
                      )}

                      {cat.subcategories.length === 0 && addingSubToCatId !== cat.id && (
                        <p style={{ padding: '12px 16px 12px 52px', fontSize: 'var(--font-xs)', color: 'var(--color-neutral-400)', margin: 0 }}>
                          Nenhuma subcategoria
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{
            padding: '40px', textAlign: 'center', borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--color-neutral-300)',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}>
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', margin: '0 0 4px' }}>Nenhuma categoria cadastrada</p>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-neutral-400)', margin: 0 }}>Use o campo acima para criar a primeira categoria</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Finance Categories ─────────────────────────────────

function FinanceCategories() {
  const { data: categories, loading, refetch } = useApi<FinanceCategory[]>('/finance/categories')
  const [activeType, setActiveType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const filtered = categories?.filter((c) => c.type === activeType) ?? []

  const handleAdd = useCallback(async () => {
    const name = newName.trim()
    if (!name) return
    await apiClient('/finance/categories', { method: 'POST', body: { name, type: activeType } })
    setNewName('')
    refetch()
  }, [newName, activeType, refetch])

  const handleUpdate = useCallback(async (id: string) => {
    const name = editingName.trim()
    if (!name) return
    await apiClient(`/finance/categories/${id}`, { method: 'PUT', body: { name } })
    setEditingId(null)
    setEditingName('')
    refetch()
  }, [editingName, refetch])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Excluir esta categoria financeira?')) return
    await apiClient(`/finance/categories/${id}`, { method: 'DELETE' })
    refetch()
  }, [refetch])

  if (loading) {
    return (
      <div style={cardStyle}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-text" style={{ height: '48px', marginBottom: '8px', borderRadius: 'var(--radius-md)' }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={cardStyle}>
        <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-900)', margin: '0 0 4px' }}>
          Categorias Financeiras
        </h2>
        <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', margin: '0 0 16px' }}>
          Categorize receitas e despesas para relatorios financeiros
        </p>

        {/* Type toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveType('EXPENSE')}
            style={{
              ...tabStyle(activeType === 'EXPENSE'),
              ...(activeType === 'EXPENSE' ? {
                color: 'var(--color-danger-700)',
                backgroundColor: 'var(--color-danger-50)',
                borderColor: 'var(--color-danger-300)',
              } : {}),
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><polyline points="19 12 12 19 5 12" />
            </svg>
            Despesas
          </button>
          <button
            onClick={() => setActiveType('INCOME')}
            style={{
              ...tabStyle(activeType === 'INCOME'),
              ...(activeType === 'INCOME' ? {
                color: 'var(--color-success-700)',
                backgroundColor: 'var(--color-success-50)',
                borderColor: 'var(--color-success-300)',
              } : {}),
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" /><polyline points="5 12 12 5 19 12" />
            </svg>
            Receitas
          </button>
        </div>

        {/* Add new */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={`Nova categoria de ${activeType === 'EXPENSE' ? 'despesa' : 'receita'}...`}
            style={{ ...inputStyle, flex: 1 }}
          />
          <button onClick={handleAdd} disabled={!newName.trim()} style={{ ...primaryBtnStyle, opacity: newName.trim() ? 1 : 0.5 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Adicionar
          </button>
        </div>

        {/* List */}
        {filtered.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filtered.map((cat) => {
              const isEditing = editingId === cat.id
              const color = cat.type === 'EXPENSE' ? 'danger' : 'success'

              return (
                <div key={cat.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-neutral-200)',
                  backgroundColor: 'var(--color-white)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <span style={{
                      width: '8px', height: '8px', borderRadius: 'var(--radius-full)',
                      backgroundColor: `var(--color-${color}-500)`,
                      flexShrink: 0,
                    }} />

                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdate(cat.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                          style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: 'var(--font-sm)' }}
                        />
                        <button onClick={() => handleUpdate(cat.id)} style={{ ...primaryBtnStyle, padding: '4px 12px', fontSize: 'var(--font-xs)' }}>Salvar</button>
                        <button onClick={() => setEditingId(null)} style={{ ...secondaryBtnStyle, padding: '4px 12px', fontSize: 'var(--font-xs)' }}>Cancelar</button>
                      </div>
                    ) : (
                      <span
                        style={{ fontWeight: 500, color: 'var(--color-neutral-800)', fontSize: 'var(--font-sm)', cursor: 'pointer' }}
                        onClick={() => { setEditingId(cat.id); setEditingName(cat.name) }}
                      >
                        {cat.name}
                      </span>
                    )}
                  </div>

                  {!isEditing && (
                    <button onClick={() => handleDelete(cat.id)} title="Excluir" style={dangerBtnStyle}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                      </svg>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{
            padding: '40px', textAlign: 'center', borderRadius: 'var(--radius-md)',
            border: '1px dashed var(--color-neutral-300)',
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-neutral-300)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '12px' }}>
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-500)', margin: '0 0 4px' }}>
              Nenhuma categoria de {activeType === 'EXPENSE' ? 'despesa' : 'receita'} cadastrada
            </p>
            <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-neutral-400)', margin: 0 }}>
              Use o campo acima para criar a primeira
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
