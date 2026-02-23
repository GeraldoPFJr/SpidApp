'use client'

import { type CSSProperties, useCallback, useEffect, useState } from 'react'
import { Layout } from '@/components/Layout'
import { useApi } from '@/hooks/useApi'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { apiClient } from '@/lib/api'

// Types

interface CompanyInfo {
  tradeName: string
  legalName: string
  cnpj: string
  ie: string
  address: string
  city: string
  state: string
  cep: string
  phone1: string
  phone2: string
  sellerName: string
}

interface PriceTier {
  id: string
  name: string
  isDefault: boolean
}

interface AccountInfo {
  id: string
  name: string
  type: 'CASH' | 'BANK' | 'OTHER'
  active: boolean
}

interface PrinterProfile {
  id: string
  name: string
  type: 'BLUETOOTH' | 'USB' | 'NETWORK'
  model: string
  address: string
}

interface AppSettings {
  company: CompanyInfo
  costMethod: 'FIFO' | 'AVERAGE'
  defaultPrintFormat: '60mm' | '80mm' | 'A5' | 'PDF'
  defaultPriceTierId: string
  syncEnabled: boolean
  instanceId: string
}

// Component

export default function ConfiguracoesPage() {
  const { isMobile } = useMediaQuery()
  const { data: settings, loading } = useApi<AppSettings>('/settings')
  const { data: priceTiers, refetch: refetchTiers } = useApi<PriceTier[]>('/price-tiers')
  const { data: accounts, refetch: refetchAccounts } = useApi<AccountInfo[]>('/finance/accounts')
  const { data: printers } = useApi<PrinterProfile[]>('/settings/printers')

  const [activeSection, setActiveSection] = useState('company')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Company form
  const [company, setCompany] = useState<CompanyInfo>({
    tradeName: '', legalName: '', cnpj: '', ie: '',
    address: '', city: '', state: '', cep: '',
    phone1: '', phone2: '', sellerName: '',
  })

  // General settings
  const [costMethod, setCostMethod] = useState<'FIFO' | 'AVERAGE'>('FIFO')
  const [defaultPrintFormat, setDefaultPrintFormat] = useState<string>('80mm')
  const [defaultPriceTierId, setDefaultPriceTierId] = useState('')

  // Price tier CRUD
  const [newTierName, setNewTierName] = useState('')
  const [addingTier, setAddingTier] = useState(false)
  const [editingTierId, setEditingTierId] = useState<string | null>(null)
  const [editingTierName, setEditingTierName] = useState('')
  const [tierError, setTierError] = useState<string | null>(null)

  // Account CRUD
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountType, setNewAccountType] = useState<'CASH' | 'BANK' | 'OTHER'>('CASH')
  const [addingAccount, setAddingAccount] = useState(false)
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null)
  const [editingAccountName, setEditingAccountName] = useState('')
  const [editingAccountType, setEditingAccountType] = useState<'CASH' | 'BANK' | 'OTHER'>('CASH')
  const [accountError, setAccountError] = useState<string | null>(null)

  // Initialize from API
  useEffect(() => {
    if (!settings) return
    setCompany(settings.company)
    setCostMethod(settings.costMethod)
    setDefaultPrintFormat(settings.defaultPrintFormat)
    setDefaultPriceTierId(settings.defaultPriceTierId)
  }, [settings])

  const handleSave = useCallback(async () => {
    setSaving(true)
    setSubmitError(null)
    try {
      await apiClient('/settings', {
        method: 'PUT',
        body: { company, costMethod, defaultPrintFormat, defaultPriceTierId },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setSubmitError('Erro ao salvar configuracoes. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }, [company, costMethod, defaultPrintFormat, defaultPriceTierId])

  const updateCompany = useCallback((field: keyof CompanyInfo, value: string) => {
    setCompany((prev) => ({ ...prev, [field]: value }))
  }, [])

  const handleAddTier = useCallback(async () => {
    const name = newTierName.trim()
    if (!name) return
    setAddingTier(true)
    setTierError(null)
    try {
      const isFirst = !priceTiers || priceTiers.length === 0
      await apiClient('/price-tiers', {
        method: 'POST',
        body: { name, isDefault: isFirst },
      })
      setNewTierName('')
      refetchTiers()
    } catch {
      setTierError('Erro ao criar tabela de precos.')
    } finally {
      setAddingTier(false)
    }
  }, [newTierName, priceTiers, refetchTiers])

  const handleRenameTier = useCallback(async (id: string) => {
    const name = editingTierName.trim()
    if (!name) return
    setTierError(null)
    try {
      await apiClient(`/price-tiers/${id}`, {
        method: 'PUT',
        body: { name },
      })
      setEditingTierId(null)
      setEditingTierName('')
      refetchTiers()
    } catch {
      setTierError('Erro ao renomear tabela.')
    }
  }, [editingTierName, refetchTiers])

  const handleDeleteTier = useCallback(async (id: string, name: string) => {
    if (!confirm(`Excluir a tabela "${name}"? Esta acao nao pode ser desfeita.`)) return
    setTierError(null)
    try {
      await apiClient(`/price-tiers/${id}`, { method: 'DELETE' })
      if (defaultPriceTierId === id) setDefaultPriceTierId('')
      refetchTiers()
    } catch (err) {
      const status = err && typeof err === 'object' && 'status' in err ? (err as { status: number }).status : 0
      if (status === 409) {
        setTierError('Nao e possivel excluir: esta tabela possui precos vinculados a produtos.')
      } else {
        setTierError('Erro ao excluir tabela.')
      }
    }
  }, [defaultPriceTierId, refetchTiers])

  // Account handlers

  const accountTypeLabel = (type: string) => {
    if (type === 'CASH') return 'Dinheiro'
    if (type === 'BANK') return 'Banco'
    return 'Outro'
  }

  const handleAddAccount = useCallback(async () => {
    const name = newAccountName.trim()
    if (!name) return
    setAddingAccount(true)
    setAccountError(null)
    try {
      await apiClient('/finance/accounts', {
        method: 'POST',
        body: { name, type: newAccountType },
      })
      setNewAccountName('')
      setNewAccountType('CASH')
      refetchAccounts()
    } catch {
      setAccountError('Erro ao criar conta.')
    } finally {
      setAddingAccount(false)
    }
  }, [newAccountName, newAccountType, refetchAccounts])

  const handleRenameAccount = useCallback(async (id: string) => {
    const name = editingAccountName.trim()
    if (!name) return
    setAccountError(null)
    try {
      await apiClient(`/finance/accounts/${id}`, {
        method: 'PUT',
        body: { name, type: editingAccountType },
      })
      setEditingAccountId(null)
      setEditingAccountName('')
      refetchAccounts()
    } catch {
      setAccountError('Erro ao atualizar conta.')
    }
  }, [editingAccountName, editingAccountType, refetchAccounts])

  const handleDeleteAccount = useCallback(async (id: string, name: string) => {
    if (!confirm(`Desativar a conta "${name}"? Ela nao aparecera mais nas opcoes de pagamento.`)) return
    setAccountError(null)
    try {
      await apiClient(`/finance/accounts/${id}`, { method: 'DELETE' })
      refetchAccounts()
    } catch {
      setAccountError('Erro ao desativar conta.')
    }
  }, [refetchAccounts])

  // Styles

  const navBtnStyle = (active: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: isMobile ? '10px 14px' : '10px 14px',
    fontSize: 'var(--font-sm)',
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--color-primary-700)' : 'var(--color-neutral-600)',
    backgroundColor: active ? 'var(--color-primary-50)' : 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    textAlign: 'left' as const,
    transition: 'all var(--transition-fast)',
    width: isMobile ? 'auto' : '100%',
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
    minHeight: '44px',
  })

  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: isMobile ? '16px' : '24px',
    boxShadow: 'var(--shadow-sm)',
  }

  const sectionTitleStyle: CSSProperties = {
    fontSize: 'var(--font-lg)',
    fontWeight: 600,
    color: 'var(--color-neutral-900)',
    margin: '0 0 4px',
  }

  const sectionDescStyle: CSSProperties = {
    fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-500)',
    margin: '0 0 20px',
  }

  const labelStyle: CSSProperties = {
    fontSize: 'var(--font-sm)',
    fontWeight: 500,
    color: 'var(--color-neutral-700)',
    marginBottom: '4px',
    display: 'block',
  }

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: isMobile ? '10px 12px' : '8px 12px',
    fontSize: 'var(--font-base)',
    color: 'var(--color-neutral-800)',
    backgroundColor: 'var(--color-white)',
    border: '1px solid var(--color-neutral-300)',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    transition: 'border-color var(--transition-fast)',
    minHeight: isMobile ? '44px' : 'auto',
  }

  const radioGroupStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  }

  const radioItemStyle = (selected: boolean): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: isMobile ? '16px' : '14px 16px',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${selected ? 'var(--color-primary-300)' : 'var(--color-neutral-200)'}`,
    backgroundColor: selected ? 'var(--color-primary-50)' : 'var(--color-white)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  })

  const radioCircleStyle = (selected: boolean): CSSProperties => ({
    width: '18px',
    height: '18px',
    borderRadius: 'var(--radius-full)',
    border: `2px solid ${selected ? 'var(--color-primary-600)' : 'var(--color-neutral-300)'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'all var(--transition-fast)',
  })

  const radioInnerStyle: CSSProperties = {
    width: '8px',
    height: '8px',
    borderRadius: 'var(--radius-full)',
    backgroundColor: 'var(--color-primary-600)',
  }

  const printerCardStyle: CSSProperties = {
    display: 'flex',
    alignItems: isMobile ? 'flex-start' : 'center',
    justifyContent: 'space-between',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? '8px' : '0',
    padding: '16px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-neutral-200)',
    backgroundColor: 'var(--color-white)',
  }

  const chipStyle = (active: boolean): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isMobile ? '10px 20px' : '8px 20px',
    fontSize: 'var(--font-sm)',
    fontWeight: active ? 600 : 400,
    color: active ? 'var(--color-primary-700)' : 'var(--color-neutral-600)',
    backgroundColor: active ? 'var(--color-primary-50)' : 'var(--color-white)',
    border: `1px solid ${active ? 'var(--color-primary-300)' : 'var(--color-neutral-300)'}`,
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
    minHeight: '44px',
    flex: isMobile ? '1' : 'none',
  })

  const saveBtnStyle: CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 24px',
    fontSize: 'var(--font-sm)',
    fontWeight: 600,
    color: 'var(--color-white)',
    backgroundColor: saved ? 'var(--color-success-600)' : 'var(--color-primary-600)',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: saving ? 'not-allowed' : 'pointer',
    opacity: saving ? 0.7 : 1,
    transition: 'all var(--transition-fast)',
    minHeight: '44px',
    width: isMobile ? '100%' : 'auto',
  }

  // Navigation items

  const sections = [
    { id: 'company', label: 'Dados do Cupom', icon: 'M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM9 17H7v-2h2v2zm0-4H7v-2h2v2zm0-4H7V7h2v2zm8 8h-6v-2h6v2zm0-4h-6v-2h6v2zm0-4h-6V7h6v2z' },
    { id: 'cost', label: 'Metodo de Custo', icon: 'M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2M9 14l2 2 4-4' },
    { id: 'pricing', label: 'Tabela de Precos', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6' },
    { id: 'accounts', label: 'Contas', icon: 'M2 7a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V7zm0 3h20' },
    { id: 'printing', label: 'Impressao', icon: 'M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z' },
    { id: 'sync', label: 'Sincronizacao', icon: 'M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0118.8-4.3M22 12.5a10 10 0 01-18.8 4.2' },
  ]

  // Render skeleton

  if (loading) {
    return (
      <Layout>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1000px' }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>Configuracoes</h1>
          </div>
          <div style={{ display: 'flex', gap: '24px', flexDirection: isMobile ? 'column' : 'row' }}>
            {!isMobile && (
              <div style={{ width: '220px' }}>
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton skeleton-text" style={{ height: '40px', marginBottom: '4px', borderRadius: 'var(--radius-md)' }} />)}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-card" style={{ height: '400px', borderRadius: 'var(--radius-lg)' }} />
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Render

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px', maxWidth: '1000px' }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: isMobile ? '12px' : '16px',
        }}>
          <div>
            <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>Configuracoes</h1>
          </div>
          <button onClick={handleSave} disabled={saving} style={saveBtnStyle}>
            {saving ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spin">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                Salvando...
              </>
            ) : saved ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Salvo
              </>
            ) : (
              'Salvar Alteracoes'
            )}
          </button>
        </div>

        {submitError && (
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-danger-50)', border: '1px solid var(--color-danger-100)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-700)', fontSize: 'var(--font-sm)' }}>
            {submitError}
          </div>
        )}

        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '16px' : '24px',
          maxWidth: '1000px',
        }}>
          {/* Navigation - horizontal scrollable on mobile, sidebar on desktop */}
          <nav style={isMobile ? {
            display: 'flex', gap: '4px', overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: '4px',
            margin: '0 -16px', padding: '0 16px 4px',
          } : {
            width: '220px', flexShrink: 0,
            display: 'flex', flexDirection: 'column', gap: '4px',
          }}>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={navBtnStyle(activeSection === s.id)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <path d={s.icon} />
                </svg>
                {s.label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px' }}>
            {/* Company Info */}
            {activeSection === 'company' && (
              <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>Dados do Cupom</h2>
                <p style={sectionDescStyle}>Informacoes que aparecem no cupom nao fiscal</p>

                <div className="form-grid-2">
                  <div>
                    <label style={labelStyle}>Nome Fantasia</label>
                    <input type="text" value={company.tradeName} onChange={(e) => updateCompany('tradeName', e.target.value)} style={inputStyle} placeholder="Minha Empresa" />
                  </div>
                  <div>
                    <label style={labelStyle}>Razao Social</label>
                    <input type="text" value={company.legalName} onChange={(e) => updateCompany('legalName', e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>CNPJ</label>
                    <input type="text" value={company.cnpj} onChange={(e) => updateCompany('cnpj', e.target.value)} style={inputStyle} placeholder="00.000.000/0000-00" />
                  </div>
                  <div>
                    <label style={labelStyle}>Inscricao Estadual</label>
                    <input type="text" value={company.ie} onChange={(e) => updateCompany('ie', e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Endereco</label>
                    <input type="text" value={company.address} onChange={(e) => updateCompany('address', e.target.value)} style={inputStyle} placeholder="Rua, numero, bairro" />
                  </div>
                  <div>
                    <label style={labelStyle}>Cidade</label>
                    <input type="text" value={company.city} onChange={(e) => updateCompany('city', e.target.value)} style={inputStyle} />
                  </div>
                  <div className="form-grid-2" style={{ gap: '12px' }}>
                    <div>
                      <label style={labelStyle}>UF</label>
                      <input type="text" value={company.state} onChange={(e) => updateCompany('state', e.target.value)} style={inputStyle} maxLength={2} placeholder="SP" />
                    </div>
                    <div>
                      <label style={labelStyle}>CEP</label>
                      <input type="text" value={company.cep} onChange={(e) => updateCompany('cep', e.target.value)} style={inputStyle} placeholder="00000-000" />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Telefone 1</label>
                    <input type="text" value={company.phone1} onChange={(e) => updateCompany('phone1', e.target.value)} style={inputStyle} placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                    <label style={labelStyle}>Telefone 2</label>
                    <input type="text" value={company.phone2} onChange={(e) => updateCompany('phone2', e.target.value)} style={inputStyle} placeholder="(00) 00000-0000" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Nome do Vendedor</label>
                    <input type="text" value={company.sellerName} onChange={(e) => updateCompany('sellerName', e.target.value)} style={inputStyle} placeholder="Nome que aparece no cupom" />
                  </div>
                </div>
              </div>
            )}

            {/* Cost Method */}
            {activeSection === 'cost' && (
              <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>Metodo de Custo</h2>
                <p style={sectionDescStyle}>Define como o custo dos produtos vendidos (COGS) e calculado</p>

                <div style={radioGroupStyle}>
                  <div
                    style={radioItemStyle(costMethod === 'FIFO')}
                    onClick={() => setCostMethod('FIFO')}
                  >
                    <div style={radioCircleStyle(costMethod === 'FIFO')}>
                      {costMethod === 'FIFO' && <div style={radioInnerStyle} />}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--color-neutral-900)', margin: '0 0 2px', fontSize: 'var(--font-sm)' }}>
                        FIFO (Primeiro a Entrar, Primeiro a Sair)
                      </p>
                      <p style={{ color: 'var(--color-neutral-500)', margin: 0, fontSize: 'var(--font-xs)' }}>
                        Compras geram lotes; vendas consomem lotes na ordem de entrada. Recomendado para maior precisao.
                      </p>
                    </div>
                  </div>
                  <div
                    style={radioItemStyle(costMethod === 'AVERAGE')}
                    onClick={() => setCostMethod('AVERAGE')}
                  >
                    <div style={radioCircleStyle(costMethod === 'AVERAGE')}>
                      {costMethod === 'AVERAGE' && <div style={radioInnerStyle} />}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--color-neutral-900)', margin: '0 0 2px', fontSize: 'var(--font-sm)' }}>
                        Custo Medio
                      </p>
                      <p style={{ color: 'var(--color-neutral-500)', margin: 0, fontSize: 'var(--font-xs)' }}>
                        Recalcula o custo medio apos cada entrada. COGS usa o custo medio vigente.
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '20px', padding: '14px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-warning-50)', border: '1px solid var(--color-warning-100)' }}>
                  <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-warning-700)', margin: 0 }}>
                    <strong>Atencao:</strong> Alterar o metodo de custo afeta o calculo do lucro bruto e liquido para vendas futuras. Vendas ja realizadas mantem o custo calculado no momento da venda.
                  </p>
                </div>
              </div>
            )}

            {/* Price Tiers */}
            {activeSection === 'pricing' && (
              <>
                <div style={cardStyle}>
                  <h2 style={sectionTitleStyle}>Tabelas de Precos</h2>
                  <p style={sectionDescStyle}>Crie tabelas de preco (ex: Varejo, Atacado) para definir precos diferentes por produto</p>

                  {tierError && (
                    <div style={{ padding: '10px 14px', marginBottom: '16px', backgroundColor: 'var(--color-danger-50)', border: '1px solid var(--color-danger-100)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-700)', fontSize: 'var(--font-xs)' }}>
                      {tierError}
                    </div>
                  )}

                  {/* Add new tier */}
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px', marginBottom: '16px' }}>
                    <input
                      type="text"
                      value={newTierName}
                      onChange={(e) => setNewTierName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddTier() }}
                      placeholder="Nome da tabela (ex: Varejo, Atacado)"
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <button
                      onClick={handleAddTier}
                      disabled={addingTier || !newTierName.trim()}
                      style={{
                        padding: '10px 20px', fontSize: 'var(--font-sm)', fontWeight: 600,
                        color: 'var(--color-white)', backgroundColor: 'var(--color-primary-600)',
                        border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        opacity: addingTier || !newTierName.trim() ? 0.5 : 1,
                        whiteSpace: 'nowrap', minHeight: '44px',
                      }}
                    >
                      {addingTier ? 'Criando...' : '+ Adicionar'}
                    </button>
                  </div>

                  {/* List tiers */}
                  {priceTiers && priceTiers.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {priceTiers.map((tier) => (
                        <div
                          key={tier.id}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: isMobile ? '14px 12px' : '12px 16px', borderRadius: 'var(--radius-md)',
                            border: `1px solid ${defaultPriceTierId === tier.id ? 'var(--color-primary-300)' : 'var(--color-neutral-200)'}`,
                            backgroundColor: defaultPriceTierId === tier.id ? 'var(--color-primary-50)' : 'var(--color-white)',
                            flexWrap: isMobile ? 'wrap' : 'nowrap', gap: isMobile ? '8px' : '0',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                            <div
                              onClick={() => setDefaultPriceTierId(tier.id)}
                              style={{ ...radioCircleStyle(defaultPriceTierId === tier.id), cursor: 'pointer' }}
                            >
                              {defaultPriceTierId === tier.id && <div style={radioInnerStyle} />}
                            </div>

                            {editingTierId === tier.id ? (
                              <div style={{ display: 'flex', gap: '6px', flex: 1, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                                <input
                                  type="text"
                                  value={editingTierName}
                                  onChange={(e) => setEditingTierName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameTier(tier.id)
                                    if (e.key === 'Escape') { setEditingTierId(null); setEditingTierName('') }
                                  }}
                                  autoFocus
                                  style={{ ...inputStyle, flex: 1, padding: '6px 8px', fontSize: 'var(--font-sm)' }}
                                />
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    onClick={() => handleRenameTier(tier.id)}
                                    style={{
                                      padding: '6px 12px', fontSize: 'var(--font-xs)', fontWeight: 500,
                                      color: 'var(--color-white)', backgroundColor: 'var(--color-primary-600)',
                                      border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', minHeight: '36px',
                                    }}
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    onClick={() => { setEditingTierId(null); setEditingTierName('') }}
                                    style={{
                                      padding: '6px 12px', fontSize: 'var(--font-xs)', fontWeight: 500,
                                      color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-neutral-100)',
                                      border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', minHeight: '36px',
                                    }}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, cursor: 'pointer', minWidth: 0 }}
                                onClick={() => setDefaultPriceTierId(tier.id)}
                              >
                                <span style={{ fontWeight: 500, color: 'var(--color-neutral-800)', fontSize: 'var(--font-sm)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {tier.name}
                                </span>
                                {defaultPriceTierId === tier.id && (
                                  <span style={{
                                    display: 'inline-flex', padding: '1px 8px',
                                    fontSize: 'var(--font-xs)', fontWeight: 500,
                                    borderRadius: 'var(--radius-full)',
                                    backgroundColor: 'var(--color-primary-100)', color: 'var(--color-primary-700)',
                                    flexShrink: 0,
                                  }}>
                                    Padrao
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {editingTierId !== tier.id && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={() => { setEditingTierId(tier.id); setEditingTierName(tier.name) }}
                                title="Renomear"
                                style={{
                                  padding: '8px', backgroundColor: 'transparent', border: 'none',
                                  borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-neutral-500)',
                                  minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteTier(tier.id, tier.name)}
                                title="Excluir"
                                style={{
                                  padding: '8px', backgroundColor: 'transparent', border: 'none',
                                  borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-danger-500)',
                                  minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-neutral-400)', fontSize: 'var(--font-sm)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-neutral-300)' }}>
                      Nenhuma tabela de precos cadastrada. Crie uma acima.
                    </div>
                  )}

                  <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--color-primary-100)' }}>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-primary-700)', margin: 0 }}>
                      <strong>Dica:</strong> Selecione a tabela padrao clicando no circulo a esquerda. Os precos de cada produto sao configurados na tela de cadastro/edicao do produto, na secao &quot;Precos&quot;.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Accounts */}
            {activeSection === 'accounts' && (
              <>
                <div style={cardStyle}>
                  <h2 style={sectionTitleStyle}>Contas Financeiras</h2>
                  <p style={sectionDescStyle}>Contas usadas nos pagamentos de vendas e lancamentos financeiros (ex: Caixa, Banco do Brasil, Pix)</p>

                  {accountError && (
                    <div style={{ padding: '10px 14px', marginBottom: '16px', backgroundColor: 'var(--color-danger-50)', border: '1px solid var(--color-danger-100)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-700)', fontSize: 'var(--font-xs)' }}>
                      {accountError}
                    </div>
                  )}

                  {/* Add new account */}
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px', marginBottom: '16px' }}>
                    <input
                      type="text"
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleAddAccount() }}
                      placeholder="Nome da conta (ex: Caixa, Pix Nubank)"
                      style={{ ...inputStyle, flex: 1 }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <select
                        value={newAccountType}
                        onChange={(e) => setNewAccountType(e.target.value as 'CASH' | 'BANK' | 'OTHER')}
                        style={{
                          ...inputStyle, width: isMobile ? '50%' : 'auto', flex: isMobile ? 1 : 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <option value="CASH">Dinheiro</option>
                        <option value="BANK">Banco</option>
                        <option value="OTHER">Outro</option>
                      </select>
                      <button
                        onClick={handleAddAccount}
                        disabled={addingAccount || !newAccountName.trim()}
                        style={{
                          padding: '10px 20px', fontSize: 'var(--font-sm)', fontWeight: 600,
                          color: 'var(--color-white)', backgroundColor: 'var(--color-primary-600)',
                          border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                          opacity: addingAccount || !newAccountName.trim() ? 0.5 : 1,
                          whiteSpace: 'nowrap', minHeight: '44px',
                        }}
                      >
                        {addingAccount ? 'Criando...' : '+ Adicionar'}
                      </button>
                    </div>
                  </div>

                  {/* List accounts */}
                  {accounts && accounts.filter(a => a.active).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {accounts.filter(a => a.active).map((acc) => (
                        <div
                          key={acc.id}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: isMobile ? '14px 12px' : '12px 16px', borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-neutral-200)',
                            backgroundColor: 'var(--color-white)',
                            flexWrap: isMobile ? 'wrap' : 'nowrap', gap: isMobile ? '8px' : '0',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                            {editingAccountId === acc.id ? (
                              <div style={{ display: 'flex', gap: '6px', flex: 1, alignItems: 'center', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                                <input
                                  type="text"
                                  value={editingAccountName}
                                  onChange={(e) => setEditingAccountName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameAccount(acc.id)
                                    if (e.key === 'Escape') { setEditingAccountId(null); setEditingAccountName('') }
                                  }}
                                  autoFocus
                                  style={{ ...inputStyle, flex: 1, padding: '6px 8px', fontSize: 'var(--font-sm)' }}
                                />
                                <select
                                  value={editingAccountType}
                                  onChange={(e) => setEditingAccountType(e.target.value as 'CASH' | 'BANK' | 'OTHER')}
                                  style={{
                                    ...inputStyle, width: 'auto', padding: '6px 8px', fontSize: 'var(--font-xs)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  <option value="CASH">Dinheiro</option>
                                  <option value="BANK">Banco</option>
                                  <option value="OTHER">Outro</option>
                                </select>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  <button
                                    onClick={() => handleRenameAccount(acc.id)}
                                    style={{
                                      padding: '6px 12px', fontSize: 'var(--font-xs)', fontWeight: 500,
                                      color: 'var(--color-white)', backgroundColor: 'var(--color-primary-600)',
                                      border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', minHeight: '36px',
                                    }}
                                  >
                                    Salvar
                                  </button>
                                  <button
                                    onClick={() => { setEditingAccountId(null); setEditingAccountName('') }}
                                    style={{
                                      padding: '6px 12px', fontSize: 'var(--font-xs)', fontWeight: 500,
                                      color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-neutral-100)',
                                      border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer', minHeight: '36px',
                                    }}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                <span style={{ fontWeight: 500, color: 'var(--color-neutral-800)', fontSize: 'var(--font-sm)' }}>
                                  {acc.name}
                                </span>
                                <span style={{
                                  display: 'inline-flex', padding: '1px 8px',
                                  fontSize: 'var(--font-xs)', fontWeight: 500,
                                  borderRadius: 'var(--radius-full)',
                                  backgroundColor: acc.type === 'CASH' ? 'var(--color-success-100)' : acc.type === 'BANK' ? 'var(--color-primary-100)' : 'var(--color-neutral-100)',
                                  color: acc.type === 'CASH' ? 'var(--color-success-700)' : acc.type === 'BANK' ? 'var(--color-primary-700)' : 'var(--color-neutral-600)',
                                }}>
                                  {accountTypeLabel(acc.type)}
                                </span>
                              </div>
                            )}
                          </div>

                          {editingAccountId !== acc.id && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={() => { setEditingAccountId(acc.id); setEditingAccountName(acc.name); setEditingAccountType(acc.type) }}
                                title="Editar"
                                style={{
                                  padding: '8px', backgroundColor: 'transparent', border: 'none',
                                  borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-neutral-500)',
                                  minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteAccount(acc.id, acc.name)}
                                title="Desativar"
                                style={{
                                  padding: '8px', backgroundColor: 'transparent', border: 'none',
                                  borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-danger-500)',
                                  minWidth: '36px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-neutral-400)', fontSize: 'var(--font-sm)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-neutral-300)' }}>
                      Nenhuma conta cadastrada. Crie uma acima para usar nos pagamentos.
                    </div>
                  )}

                  <div style={{ marginTop: '16px', padding: '12px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--color-primary-100)' }}>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-primary-700)', margin: 0 }}>
                      <strong>Dica:</strong> Crie pelo menos uma conta (ex: &quot;Caixa&quot;) para que ela apareca nas opcoes de pagamento ao registrar uma venda.
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Printing */}
            {activeSection === 'printing' && (
              <>
                <div style={cardStyle}>
                  <h2 style={sectionTitleStyle}>Formato Padrao</h2>
                  <p style={sectionDescStyle}>Formato de impressao padrao ao finalizar uma venda</p>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {[
                      { value: '60mm', label: 'Termica 60mm' },
                      { value: '80mm', label: 'Termica 80mm' },
                      { value: 'A5', label: 'A5 (PDF)' },
                      { value: 'PDF', label: 'PDF Digital' },
                    ].map((fmt) => (
                      <button
                        key={fmt.value}
                        onClick={() => setDefaultPrintFormat(fmt.value)}
                        style={chipStyle(defaultPrintFormat === fmt.value)}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={cardStyle}>
                  <div style={{
                    display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'space-between', marginBottom: '16px',
                    flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '4px' : '0',
                  }}>
                    <div>
                      <h2 style={sectionTitleStyle}>Impressoras</h2>
                      <p style={{ ...sectionDescStyle, margin: 0 }}>Perfis de impressora configurados</p>
                    </div>
                  </div>

                  {printers && printers.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {printers.map((p) => (
                        <div key={p.id} style={printerCardStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '40px', height: '40px', borderRadius: 'var(--radius-md)',
                              backgroundColor: 'var(--color-neutral-100)', color: 'var(--color-neutral-600)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />
                              </svg>
                            </div>
                            <div>
                              <p style={{ fontWeight: 500, color: 'var(--color-neutral-800)', margin: 0, fontSize: 'var(--font-sm)' }}>
                                {p.name}
                              </p>
                              <p style={{ color: 'var(--color-neutral-500)', margin: 0, fontSize: 'var(--font-xs)' }}>
                                {p.model} - {p.type === 'BLUETOOTH' ? 'Bluetooth' : p.type === 'USB' ? 'USB' : 'Rede'}
                              </p>
                            </div>
                          </div>
                          <span style={{
                            display: 'inline-flex', padding: '2px 8px',
                            fontSize: 'var(--font-xs)', fontWeight: 500,
                            borderRadius: 'var(--radius-full)',
                            backgroundColor: 'var(--color-success-100)', color: 'var(--color-success-700)',
                          }}>
                            Ativo
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '32px', textAlign: 'center', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-neutral-300)', color: 'var(--color-neutral-400)', fontSize: 'var(--font-sm)' }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-neutral-300)', marginBottom: '8px' }}>
                        <path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z" />
                      </svg>
                      <p style={{ margin: '4px 0 0' }}>Nenhuma impressora configurada</p>
                      <p style={{ margin: '4px 0 0', fontSize: 'var(--font-xs)', color: 'var(--color-neutral-400)' }}>Configure impressoras pelo aplicativo mobile</p>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Sync */}
            {activeSection === 'sync' && (
              <div style={cardStyle}>
                <h2 style={sectionTitleStyle}>Sincronizacao</h2>
                <p style={sectionDescStyle}>Configuracoes de sincronizacao entre dispositivos</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    alignItems: isMobile ? 'flex-start' : 'center',
                    justifyContent: 'space-between',
                    padding: '16px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-neutral-200)', backgroundColor: 'var(--color-neutral-50)',
                    gap: isMobile ? '8px' : '0',
                  }}>
                    <div>
                      <p style={{ fontWeight: 500, color: 'var(--color-neutral-800)', margin: 0, fontSize: 'var(--font-sm)' }}>
                        Status da Sincronizacao
                      </p>
                      <p style={{ color: 'var(--color-neutral-500)', margin: '2px 0 0', fontSize: 'var(--font-xs)' }}>
                        Sincronizacao automatica ativa
                      </p>
                    </div>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '4px 12px', fontSize: 'var(--font-xs)', fontWeight: 600,
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--color-success-100)', color: 'var(--color-success-700)',
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-success-500)' }} />
                      Online
                    </span>
                  </div>

                  <div>
                    <label style={labelStyle}>ID da Instalacao</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        value={settings?.instanceId ?? ''}
                        readOnly
                        style={{ ...inputStyle, backgroundColor: 'var(--color-neutral-50)', color: 'var(--color-neutral-500)', fontFamily: 'monospace', fontSize: 'var(--font-sm)', flex: 1 }}
                      />
                      <button
                        onClick={() => {
                          if (settings?.instanceId) {
                            navigator.clipboard.writeText(settings.instanceId)
                          }
                        }}
                        style={{
                          padding: '8px 14px', fontSize: 'var(--font-xs)', fontWeight: 500,
                          color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)',
                          border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)',
                          cursor: 'pointer', whiteSpace: 'nowrap', minHeight: '44px',
                        }}
                      >
                        Copiar
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: '8px', padding: '14px 16px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-50)', border: '1px solid var(--color-primary-100)' }}>
                    <p style={{ fontSize: 'var(--font-xs)', color: 'var(--color-primary-700)', margin: 0 }}>
                      <strong>Sobre a sincronizacao:</strong> O aplicativo mobile sincroniza automaticamente quando conectado a internet. Dados inseridos offline sao enviados ao servidor assim que a conexao for restabelecida.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
