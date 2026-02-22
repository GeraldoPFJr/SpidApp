import { useState, FormEvent } from 'react'
import { apiClient } from '../../lib/api'
import { setAuthToken } from '../../lib/credentials'

interface RegisterResponse {
  token: string
  tenant: { id: string; email: string; companyName: string }
}

interface RegisterPageProps {
  onRegister: () => void
  onGoToLogin: () => void
}

export function RegisterPage({ onRegister, onGoToLogin }: RegisterPageProps) {
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
      const res = await apiClient<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: { email, password, companyName },
      })
      setAuthToken(res.token)
      onRegister()
    } catch (err) {
      if (err instanceof Error && err.message.includes('409')) {
        setError('Este email ja esta cadastrado')
      } else {
        setError('Erro ao criar conta. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    fontFamily: 'Inter, system-ui, sans-serif',
    padding: '16px',
  }

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '380px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '40px 28px',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: 500,
    color: '#374151',
    marginBottom: '6px',
  }

  const buttonStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.6 : 1,
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Spid</h1>
          <p style={{ fontSize: '15px', color: '#64748b', marginTop: '8px' }}>Criar Conta</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Nome da Empresa</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              placeholder="Ex: Ovos do Geraldo"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Escolha uma senha"
              style={inputStyle}
            />
          </div>

          {error && (
            <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Criando conta...' : 'Criar Conta'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748b' }}>
          Ja tem conta?{' '}
          <button
            onClick={onGoToLogin}
            style={{ color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}
          >
            Faca login
          </button>
        </p>
      </div>
    </div>
  )
}
