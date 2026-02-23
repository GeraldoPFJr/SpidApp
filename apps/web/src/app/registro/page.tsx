'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export default function RegistroPage() {
  const router = useRouter()
  const { isMobile } = useMediaQuery()
  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, companyName }),
      })

      if (!res.ok) {
        const data = await res.json()
        if (res.status === 409) {
          setError('Este email ja esta cadastrado')
        } else {
          setError(data.error || 'Erro ao criar conta')
        }
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Erro de conexao')
    } finally {
      setLoading(false)
    }
  }

  const inputPadding = isMobile ? '14px' : '12px'
  const inputFontSize = '16px' // Always 16px to prevent iOS zoom

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8fafc',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        padding: isMobile ? '32px 20px' : '40px 32px',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: isMobile ? '28px' : '36px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Spid</h1>
          <p style={{ fontSize: '16px', color: '#64748b', marginTop: '8px' }}>Criar Conta</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              Nome da Empresa
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="Ex: Ovos do Geraldo"
              style={{
                width: '100%',
                padding: inputPadding,
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: inputFontSize,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              style={{
                width: '100%',
                padding: inputPadding,
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: inputFontSize,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Escolha uma senha"
              style={{
                width: '100%',
                padding: inputPadding,
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: inputFontSize,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: isMobile ? '14px' : '12px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748b' }}>
          Ja tem conta?{' '}
          <a href="/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 500 }}>
            Faca login
          </a>
        </p>
      </div>
    </div>
  )
}
