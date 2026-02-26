'use client'

import { type CSSProperties, useCallback, useState } from 'react'
import { Layout } from '@/components/Layout'
import { useApi } from '@/hooks/useApi'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { useToast } from '@/hooks/useToast'
import { apiClient } from '@/lib/api'
import { Toast } from '@xpid/ui'

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
  const { isMobile } = useMediaQuery()

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
        {/* Header */}
        <div>
          <h1 style={{ fontSize: isMobile ? 'var(--font-xl)' : 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>
            Categorias
          </h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setActiveTab('products')} style={{
            ...tabStyle(activeTab === 'products'),
            flex: isMobile ? 1 : 'none',
            justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            Produtos
          </button>
          <button onClick={() => setActiveTab('finance')} style={{
            ...tabStyle(activeTab === 'finance'),
            flex: isMobile ? 1 : 'none',
            justifyContent: 'center',
          }}>
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
  const { isMobile } = useMediaQuery()
  const { showToast, showError, toastProps } = useToast()
  const { data: categories, loading, refetch } = useApi<Category[]>('/categories')
  const [newCatName, setNewCatName] = useState('')
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editingCatName, setEditingCatName] = useState('')
  const [newSubName, setNewSubName] = useState('')
  const [addingSubToCatId, setAddingSubToCatId] = useState<string | null>(null)
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())

  const subPaddingLeft = isMobile ? '36px' : '52px'

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
    try {
      await apiClient('/categories', { method: 'POST', body: { name } })
      setNewCatName('')
      refetch()
      showToast('Categoria criada')
    } catch (error) {
      showError(error, 'Erro ao criar categoria')
    }
  }, [newCatName, refetch, showToast, showError])

  const handleUpdateCategory = useCallback(async (id: string) => {
    const name = editingCatName.trim()
    if (!name) return
    try {
      await apiClient(`/categories/${id}`, { method: 'PUT', body: { name } })
      setEditingCatId(null)
      setEditingCatName('')
      refetch()
      showToast('Categoria atualizada')
    } catch (error) {
      showError(error, 'Erro ao atualizar categoria')
    }
  }, [editingCatName, refetch, showToast, showError])

  const handleDeleteCategory = useCallback(async (id: string) => {
    if (!confirm('Excluir esta categoria e todas as suas subcategorias?')) return
    try {
      await apiClient(`/categories/${id}`, { method: 'DELETE' })
      refetch()
      showToast('Categoria excluida')
    } catch (error) {
      showError(error, 'Erro ao excluir categoria')
    }
  }, [refetch, showToast, showError])

  const handleAddSubcategory = useCallback(async (categoryId: string) => {
    const name = newSubName.trim()
    if (!name) return
    try {
      await apiClient(`/categories/${categoryId}/subcategories`, { method: 'POST', body: { name } })
      setNewSubName('')
      setAddingSubToCatId(null)
      refetch()
      showToast('Subcategoria criada')
    } catch (error) {
      showError(error, 'Erro ao criar subcategoria')
    }
  }, [newSubName, refetch, showToast, showError])

  const handleDeleteSubcategory = useCallback(async (id: string) => {
    if (!confirm('Excluir esta subcategoria?')) return
    try {
      await apiClient(`/subcategories/${id}`, { method: 'DELETE' })
      refetch()
      showToast('Subcategoria excluida')
    } catch (error) {
      showError(error, 'Erro ao excluir subcategoria')
    }
  }, [refetch, showToast, showError])

  const mobileCardStyle: CSSProperties = {
    ...cardStyle,
    padding: isMobile ? '16px' : '24px',
  }

  const mobileInputStyle: CSSProperties = {
    ...inputStyle,
    padding: isMobile ? '14px 12px' : '8px 12px',
    fontSize: isMobile ? '16px' : 'var(--font-base)',
  }

  if (loading) {
    return (
      <div style={mobileCardStyle}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-text" style={{ height: '48px', marginBottom: '8px', borderRadius: 'var(--radius-md)' }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Add new category */}
      <div style={mobileCardStyle}>
        <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-900)', margin: '0 0 16px' }}>
          Categorias de Produtos
        </h2>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexDirection: isMobile ? 'column' : 'row' }}>
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="Nome da nova categoria..."
            style={{ ...mobileInputStyle, flex: 1 }}
          />
          <button onClick={handleAddCategory} disabled={!newCatName.trim()} style={{
            ...primaryBtnStyle,
            opacity: newCatName.trim() ? 1 : 0.5,
            justifyContent: 'center',
            padding: isMobile ? '14px 16px' : '8px 16px',
          }}>
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
                    padding: isMobile ? '14px 12px' : '12px 16px',
                    backgroundColor: isExpanded ? 'var(--color-neutral-50)' : 'var(--color-white)',
                    transition: 'background-color var(--transition-fast)',
                    gap: '8px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '12px', flex: 1, minWidth: 0 }}>
                      <button
                        onClick={() => toggleExpand(cat.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: isMobile ? '8px' : '4px',
                          color: 'var(--color-neutral-400)', display: 'flex', alignItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform var(--transition-fast)' }}>
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </button>

                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                          <input
                            type="text"
                            value={editingCatName}
                            onChange={(e) => setEditingCatName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleUpdateCategory(cat.id)
                              if (e.key === 'Escape') setEditingCatId(null)
                            }}
                            autoFocus
                            style={{ ...mobileInputStyle, flex: 1, padding: isMobile ? '10px 8px' : '4px 8px', fontSize: 'var(--font-sm)' }}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleUpdateCategory(cat.id)} style={{ ...primaryBtnStyle, padding: isMobile ? '10px 12px' : '4px 12px', fontSize: 'var(--font-xs)' }}>Salvar</button>
                            <button onClick={() => setEditingCatId(null)} style={{ ...secondaryBtnStyle, padding: isMobile ? '10px 12px' : '4px 12px', fontSize: 'var(--font-xs)' }}>Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <span
                          style={{ fontWeight: 500, color: 'var(--color-neutral-800)', fontSize: 'var(--font-sm)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          onClick={() => { setEditingCatId(cat.id); setEditingCatName(cat.name) }}
                        >
                          {cat.name}
                        </span>
                      )}
                    </div>

                    {!isEditing && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        {subCount > 0 && (
                          <span style={{
                            display: 'inline-flex', padding: '2px 8px',
                            fontSize: 'var(--font-xs)', fontWeight: 500,
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)',
                          }}>
                            {subCount}
                          </span>
                        )}
                        <button
                          onClick={() => { setAddingSubToCatId(cat.id); setExpandedCats((prev) => new Set(prev).add(cat.id)) }}
                          title="Adicionar subcategoria"
                          style={{ ...secondaryBtnStyle, padding: isMobile ? '8px' : '4px 8px' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteCategory(cat.id)} title="Excluir categoria" style={{ ...dangerBtnStyle, padding: isMobile ? '8px' : '6px' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Subcategories */}
                  {isExpanded && (
                    <div style={{ borderTop: '1px solid var(--color-neutral-200)', backgroundColor: 'var(--color-neutral-50)' }}>
                      {cat.subcategories.map((sub) => (
                        <div key={sub.id} style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: `${isMobile ? '12px' : '8px'} ${isMobile ? '12px' : '16px'} ${isMobile ? '12px' : '8px'} ${subPaddingLeft}`,
                          borderBottom: '1px solid var(--color-neutral-100)',
                        }}>
                          <span style={{ fontSize: 'var(--font-sm)', color: 'var(--color-neutral-600)' }}>
                            {sub.name}
                          </span>
                          <button onClick={() => handleDeleteSubcategory(sub.id)} title="Excluir subcategoria" style={{ ...dangerBtnStyle, padding: isMobile ? '8px' : '6px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        </div>
                      ))}

                      {/* Add subcategory inline */}
                      {addingSubToCatId === cat.id ? (
                        <div style={{
                          display: 'flex', gap: '8px',
                          padding: `${isMobile ? '12px' : '8px'} ${isMobile ? '12px' : '16px'} ${isMobile ? '12px' : '8px'} ${subPaddingLeft}`,
                          flexWrap: isMobile ? 'wrap' : 'nowrap',
                        }}>
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
                            style={{ ...mobileInputStyle, flex: 1, padding: isMobile ? '10px 8px' : '4px 8px', fontSize: 'var(--font-sm)' }}
                          />
                          <div style={{ display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
                            <button onClick={() => handleAddSubcategory(cat.id)} style={{ ...primaryBtnStyle, padding: isMobile ? '10px 12px' : '4px 12px', fontSize: 'var(--font-xs)', flex: isMobile ? 1 : 'none', justifyContent: 'center' }}>Salvar</button>
                            <button onClick={() => { setAddingSubToCatId(null); setNewSubName('') }} style={{ ...secondaryBtnStyle, padding: isMobile ? '10px 12px' : '4px 12px', fontSize: 'var(--font-xs)', flex: isMobile ? 1 : 'none', justifyContent: 'center' }}>Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingSubToCatId(cat.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: `${isMobile ? '12px' : '8px'} ${isMobile ? '12px' : '16px'} ${isMobile ? '12px' : '8px'} ${subPaddingLeft}`,
                            width: '100%',
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
                        <p style={{ padding: `12px 16px 12px ${subPaddingLeft}`, fontSize: 'var(--font-xs)', color: 'var(--color-neutral-400)', margin: 0 }}>
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
      <Toast {...toastProps} />
    </div>
  )
}

// ─── Finance Categories ─────────────────────────────────

function FinanceCategories() {
  const { isMobile } = useMediaQuery()
  const { showToast, showError, toastProps } = useToast()
  const { data: categories, loading, refetch } = useApi<FinanceCategory[]>('/finance/categories')
  const [activeType, setActiveType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const filtered = categories?.filter((c) => c.type === activeType) ?? []

  const handleAdd = useCallback(async () => {
    const name = newName.trim()
    if (!name) return
    try {
      await apiClient('/finance/categories', { method: 'POST', body: { name, type: activeType } })
      setNewName('')
      refetch()
      showToast('Categoria financeira criada')
    } catch (error) {
      showError(error, 'Erro ao criar categoria')
    }
  }, [newName, activeType, refetch, showToast, showError])

  const handleUpdate = useCallback(async (id: string) => {
    const name = editingName.trim()
    if (!name) return
    try {
      await apiClient(`/finance/categories/${id}`, { method: 'PUT', body: { name } })
      setEditingId(null)
      setEditingName('')
      refetch()
      showToast('Categoria financeira atualizada')
    } catch {
      showToast('Erro ao atualizar categoria', 'error')
    }
  }, [editingName, refetch, showToast, showError])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Excluir esta categoria financeira?')) return
    try {
      await apiClient(`/finance/categories/${id}`, { method: 'DELETE' })
      refetch()
      showToast('Categoria financeira excluida')
    } catch (error) {
      showError(error, 'Erro ao excluir categoria')
    }
  }, [refetch, showToast, showError])

  const mobileCardStyle: CSSProperties = {
    ...cardStyle,
    padding: isMobile ? '16px' : '24px',
  }

  const mobileInputStyle: CSSProperties = {
    ...inputStyle,
    padding: isMobile ? '14px 12px' : '8px 12px',
    fontSize: isMobile ? '16px' : 'var(--font-base)',
  }

  if (loading) {
    return (
      <div style={mobileCardStyle}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton skeleton-text" style={{ height: '48px', marginBottom: '8px', borderRadius: 'var(--radius-md)' }} />
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={mobileCardStyle}>
        <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-900)', margin: '0 0 16px' }}>
          Categorias Financeiras
        </h2>

        {/* Type toggle */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveType('EXPENSE')}
            style={{
              ...tabStyle(activeType === 'EXPENSE'),
              flex: isMobile ? 1 : 'none',
              justifyContent: 'center',
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
              flex: isMobile ? 1 : 'none',
              justifyContent: 'center',
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
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexDirection: isMobile ? 'column' : 'row' }}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={`Nova categoria de ${activeType === 'EXPENSE' ? 'despesa' : 'receita'}...`}
            style={{ ...mobileInputStyle, flex: 1 }}
          />
          <button onClick={handleAdd} disabled={!newName.trim()} style={{
            ...primaryBtnStyle,
            opacity: newName.trim() ? 1 : 0.5,
            justifyContent: 'center',
            padding: isMobile ? '14px 16px' : '8px 16px',
          }}>
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
                  padding: isMobile ? '14px 12px' : '10px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-neutral-200)',
                  backgroundColor: 'var(--color-white)',
                  gap: '8px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <span style={{
                      width: '8px', height: '8px', borderRadius: 'var(--radius-full)',
                      backgroundColor: `var(--color-${color}-500)`,
                      flexShrink: 0,
                    }} />

                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '8px', flex: 1, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleUpdate(cat.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                          style={{ ...mobileInputStyle, flex: 1, padding: isMobile ? '10px 8px' : '4px 8px', fontSize: 'var(--font-sm)' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleUpdate(cat.id)} style={{ ...primaryBtnStyle, padding: isMobile ? '10px 12px' : '4px 12px', fontSize: 'var(--font-xs)' }}>Salvar</button>
                          <button onClick={() => setEditingId(null)} style={{ ...secondaryBtnStyle, padding: isMobile ? '10px 12px' : '4px 12px', fontSize: 'var(--font-xs)' }}>Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <span
                        style={{ fontWeight: 500, color: 'var(--color-neutral-800)', fontSize: 'var(--font-sm)', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        onClick={() => { setEditingId(cat.id); setEditingName(cat.name) }}
                      >
                        {cat.name}
                      </span>
                    )}
                  </div>

                  {!isEditing && (
                    <button onClick={() => handleDelete(cat.id)} title="Excluir" style={{ ...dangerBtnStyle, padding: isMobile ? '8px' : '6px', flexShrink: 0 }}>
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
      <Toast {...toastProps} />
    </div>
  )
}
