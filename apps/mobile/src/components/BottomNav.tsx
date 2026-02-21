import { type CSSProperties, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface NavItem {
  path: string
  label: string
  icon: JSX.Element
}

const MENU_ITEMS = [
  { path: '/produtos', label: 'Produtos' },
  { path: '/fornecedores', label: 'Fornecedores' },
  { path: '/compras', label: 'Compras' },
  { path: '/estoque', label: 'Estoque' },
  { path: '/financeiro', label: 'Financeiro' },
  { path: '/inadimplentes', label: 'Inadimplentes' },
  { path: '/configuracoes', label: 'Configuracoes' },
]

function ChartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', label: 'Inicio', icon: <ChartIcon /> },
  { path: '/vendas', label: 'Vendas', icon: <CartIcon /> },
  { path: '/clientes', label: 'Clientes', icon: <PeopleIcon /> },
  { path: '/__menu__', label: 'Menu', icon: <MenuIcon /> },
]

export function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  function isActive(path: string): boolean {
    if (path === '/') return location.pathname === '/'
    if (path === '/__menu__') {
      return MENU_ITEMS.some((m) => location.pathname.startsWith(m.path))
    }
    return location.pathname.startsWith(path)
  }

  function handleNavClick(path: string) {
    if (path === '/__menu__') {
      setMenuOpen((prev) => !prev)
    } else {
      setMenuOpen(false)
      navigate(path)
    }
  }

  function handleMenuItemClick(path: string) {
    setMenuOpen(false)
    navigate(path)
  }

  const navStyle: CSSProperties = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'var(--surface)',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    justifyContent: 'space-around',
    paddingTop: 'var(--sp-1)',
    paddingBottom: 'max(var(--sp-1), var(--safe-bottom))',
    zIndex: 100,
  }

  function itemStyle(active: boolean): CSSProperties {
    return {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '2px',
      padding: 'var(--sp-1) var(--sp-4)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: 'var(--font-xs)',
      fontWeight: active ? 600 : 400,
      color: active ? 'var(--primary)' : 'var(--text-secondary)',
      transition: 'color var(--transition-fast)',
      minWidth: '64px',
    }
  }

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 99,
    animation: 'fade-in 200ms ease both',
  }

  const drawerStyle: CSSProperties = {
    position: 'fixed',
    bottom: '64px',
    left: 0,
    right: 0,
    backgroundColor: 'var(--surface)',
    borderTopLeftRadius: 'var(--radius-xl)',
    borderTopRightRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-xl)',
    zIndex: 100,
    paddingBottom: 'max(var(--sp-4), var(--safe-bottom))',
    animation: 'slide-up 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94) both',
    maxHeight: '70vh',
    overflow: 'auto',
  }

  const drawerHeaderStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--sp-4) var(--sp-6)',
    borderBottom: '1px solid var(--border)',
  }

  const drawerTitleStyle: CSSProperties = {
    fontSize: 'var(--font-lg)',
    fontWeight: 600,
    color: 'var(--text-primary)',
  }

  const drawerCloseBtnStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 'var(--sp-1)',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-md)',
  }

  const menuItemStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--sp-4) var(--sp-6)',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid var(--border)',
    width: '100%',
    cursor: 'pointer',
    fontSize: 'var(--font-base)',
    fontWeight: 500,
    color: 'var(--text-primary)',
    transition: 'background-color var(--transition-fast)',
    minHeight: '52px',
  }

  return (
    <>
      {menuOpen && (
        <>
          <div style={overlayStyle} onClick={() => setMenuOpen(false)} />
          <div style={drawerStyle}>
            <div style={drawerHeaderStyle}>
              <span style={drawerTitleStyle}>Menu</span>
              <button
                style={drawerCloseBtnStyle}
                onClick={() => setMenuOpen(false)}
                aria-label="Fechar menu"
              >
                <CloseIcon />
              </button>
            </div>
            {MENU_ITEMS.map((item) => (
              <button
                key={item.path}
                style={{
                  ...menuItemStyle,
                  color: location.pathname.startsWith(item.path)
                    ? 'var(--primary)'
                    : 'var(--text-primary)',
                }}
                onClick={() => handleMenuItemClick(item.path)}
              >
                <span>{item.label}</span>
                <ChevronRightIcon />
              </button>
            ))}
          </div>
        </>
      )}
      <nav style={navStyle}>
        {NAV_ITEMS.map((item) => (
          <button
            key={item.path}
            style={itemStyle(isActive(item.path))}
            onClick={() => handleNavClick(item.path)}
            aria-label={item.label}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
