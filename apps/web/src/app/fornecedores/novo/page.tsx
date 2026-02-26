'use client'

import { type CSSProperties, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/Layout'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import { setToastFlash } from '@/hooks/useToast'
import { apiClient } from '@/lib/api'

export default function NovoFornecedorPage() {
  const router = useRouter()
  const { isMobile } = useMediaQuery()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [city, setCity] = useState('')
  const [productTypes, setProductTypes] = useState('')
  const [minOrder, setMinOrder] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = useCallback((): boolean => {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'Nome e obrigatorio'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }, [name])

  const handleSubmit = useCallback(async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await apiClient('/suppliers', {
        method: 'POST',
        body: {
          name: name.trim(),
          phone: phone.trim() || null,
          cnpj: cnpj.trim() || null,
          city: city.trim() || null,
          productTypes: productTypes.trim() || null,
          minOrder: minOrder.trim() || null,
          paymentTerms: paymentTerms.trim() || null,
          notes: notes.trim() || null,
        },
      })
      setToastFlash('Fornecedor salvo com sucesso')
      router.push('/fornecedores')
    } catch {
      setErrors({ submit: 'Erro ao salvar fornecedor. Tente novamente.' })
    } finally {
      setSaving(false)
    }
  }, [validate, name, phone, cnpj, city, productTypes, minOrder, paymentTerms, notes, router])

  const cardStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    padding: isMobile ? '16px' : '24px',
    boxShadow: 'var(--shadow-sm)',
  }

  const inputStyle = (hasError = false): CSSProperties => ({
    width: '100%',
    padding: isMobile ? '14px 12px' : '8px 12px',
    fontSize: isMobile ? '16px' : 'var(--font-base)',
    color: 'var(--color-neutral-800)',
    backgroundColor: 'var(--color-white)',
    border: `1px solid ${hasError ? 'var(--color-danger-500)' : 'var(--color-neutral-300)'}`,
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    transition: 'border-color var(--transition-fast)',
  })

  const labelStyle: CSSProperties = {
    fontSize: 'var(--font-sm)', fontWeight: 500, color: 'var(--color-neutral-700)',
    marginBottom: '4px', display: 'block',
  }

  const errorMsgStyle: CSSProperties = {
    fontSize: 'var(--font-xs)', color: 'var(--color-danger-600)', marginTop: '4px',
  }

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '24px', maxWidth: '720px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.back()} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: isMobile ? '44px' : '36px', height: isMobile ? '44px' : '36px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-white)', border: '1px solid var(--color-neutral-300)', cursor: 'pointer',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 style={{ fontSize: isMobile ? 'var(--font-xl)' : 'var(--font-2xl)', fontWeight: 700, color: 'var(--color-neutral-900)', margin: 0 }}>Novo Fornecedor</h1>
        </div>

        {errors.submit && (
          <div style={{ padding: '12px 16px', backgroundColor: 'var(--color-danger-50)', border: '1px solid var(--color-danger-100)', borderRadius: 'var(--radius-md)', color: 'var(--color-danger-700)', fontSize: 'var(--font-sm)' }}>
            {errors.submit}
          </div>
        )}

        <div style={cardStyle}>
          <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--color-neutral-800)', margin: '0 0 20px' }}>Informacoes do Fornecedor</h2>
          <div className="form-grid-2">
            <div>
              <label style={labelStyle}>Nome *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do fornecedor" style={inputStyle(!!errors.name)} />
              {errors.name && <p style={errorMsgStyle}>{errors.name}</p>}
            </div>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" style={inputStyle()} />
            </div>
            <div>
              <label style={labelStyle}>CNPJ</label>
              <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" style={inputStyle()} />
            </div>
            <div>
              <label style={labelStyle}>Cidade</label>
              <input type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Cidade / UF" style={inputStyle()} />
            </div>
            <div>
              <label style={labelStyle}>Tipo de Produtos</label>
              <input type="text" value={productTypes} onChange={(e) => setProductTypes(e.target.value)} placeholder="Ex: Ovos, Frios" style={inputStyle()} />
            </div>
            <div>
              <label style={labelStyle}>Pedido Minimo</label>
              <input type="text" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} placeholder="Ex: R$ 500 ou 10 caixas" style={inputStyle()} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Forma de Pagamento</label>
              <input type="text" value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="Ex: Boleto 30 dias" style={inputStyle()} />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <label style={labelStyle}>Observacoes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observacoes sobre o fornecedor..."
              style={{ ...inputStyle(), minHeight: '80px', resize: 'vertical' }}
            />
          </div>
        </div>

        <div className="form-actions">
          <button onClick={() => router.back()} style={{
            padding: isMobile ? '14px 20px' : '10px 20px', fontSize: 'var(--font-sm)', fontWeight: 500,
            color: 'var(--color-neutral-600)', backgroundColor: 'var(--color-white)',
            border: '1px solid var(--color-neutral-300)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
          }}>
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={saving} style={{
            padding: isMobile ? '14px 24px' : '10px 24px', fontSize: 'var(--font-sm)', fontWeight: 600,
            color: 'var(--color-white)', backgroundColor: 'var(--color-primary-600)',
            border: 'none', borderRadius: 'var(--radius-md)',
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
          }}>
            {saving ? 'Salvando...' : 'Salvar Fornecedor'}
          </button>
        </div>
      </div>
    </Layout>
  )
}
