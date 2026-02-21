import { useLocation, useNavigate } from 'react-router-dom'
import type { CSSProperties } from 'react'

const NAV_ITEMS = [
  { path: '/', label: 'Inicio' },
  { path: '/vendas', label: 'Vendas' },
  { path: '/clientes', label: 'Clientes' },
  { path: '/configuracoes', label: 'Mais' },
] as const

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const navStyle: CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    borderTop: '1px solid #E5E7EB',
    padding: '8px 0',
    paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
    zIndex: 100,
  }

  function itemStyle(isActive: boolean): CSSProperties {
    return {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
      padding: '4px 16px',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.75rem',
      fontWeight: isActive ? 600 : 400,
      color: isActive ? '#2563EB' : '#6B7280',
    }
  }

  return (
    <nav style={navStyle}>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.path}
          style={itemStyle(location.pathname === item.path)}
          onClick={() => navigate(item.path)}
        >
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}
