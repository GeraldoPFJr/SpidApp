'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { type CSSProperties, useState, useEffect, useCallback } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4' },
  { href: '/vendas', label: 'Vendas', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { href: '/clientes', label: 'Clientes', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href: '/produtos', label: 'Produtos', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { href: '/categorias', label: 'Categorias', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z' },
  { href: '/fornecedores', label: 'Fornecedores', icon: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z' },
  { href: '/compras', label: 'Compras', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z' },
  { href: '/estoque', label: 'Estoque', icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' },
  { href: '/financeiro', label: 'Financeiro', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href: '/inadimplentes', label: 'Inadimplentes', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z' },
  { href: '/relatorios', label: 'Relatorios', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { href: '/configuracoes', label: 'Configuracoes', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
] as const

function NavIcon({ path }: { path: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={path} />
    </svg>
  )
}

interface SidebarProps {
  mobileOpen?: boolean
  onMobileClose?: () => void
  isMobile?: boolean
}

export function Sidebar({ mobileOpen, onMobileClose, isMobile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.companyName) setCompanyName(data.companyName) })
      .catch(() => {})
  }, [])

  // Close drawer on navigation
  useEffect(() => {
    if (isMobile && mobileOpen) {
      onMobileClose?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isMobile && mobileOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isMobile, mobileOpen])

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {})
    router.push('/login')
    router.refresh()
  }

  const handleLinkClick = useCallback(() => {
    if (isMobile) onMobileClose?.()
  }, [isMobile, onMobileClose])

  // ─── Mobile Drawer Mode ────────────────────────
  if (isMobile) {
    const drawerStyle: CSSProperties = {
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      width: '280px',
      maxWidth: '85vw',
      backgroundColor: 'var(--color-neutral-800)',
      color: 'var(--color-neutral-50)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 101,
      transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      willChange: 'transform',
      overflowY: 'auto',
      WebkitOverflowScrolling: 'touch',
    }

    return (
      <>
        {/* Backdrop */}
        {mobileOpen && (
          <div
            className="drawer-backdrop"
            onClick={onMobileClose}
            aria-hidden="true"
          />
        )}

        {/* Drawer */}
        <aside style={drawerStyle}>
          {/* Logo */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 20px',
            borderBottom: '1px solid var(--color-neutral-700)',
            minHeight: '64px',
          }}>
            <span style={{
              fontSize: '1.375rem',
              fontWeight: 700,
              letterSpacing: '-0.025em',
              color: 'var(--color-white)',
            }}>
              Xpid
            </span>
            <button
              onClick={onMobileClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-neutral-400)',
                padding: '8px',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                minHeight: '44px',
                minWidth: '44px',
              }}
              aria-label="Fechar menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Nav */}
          <nav style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            padding: '12px',
            flex: 1,
            overflowY: 'auto',
          }}>
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-base)',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--color-white)' : 'var(--color-neutral-400)',
                    backgroundColor: isActive ? 'var(--color-primary-600)' : 'transparent',
                    textDecoration: 'none',
                    transition: 'all 150ms ease',
                    minHeight: '44px',
                  }}
                >
                  <NavIcon path={item.icon} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div style={{
            borderTop: '1px solid var(--color-neutral-700)',
            padding: '12px',
          }}>
            {companyName && (
              <div style={{
                fontSize: 'var(--font-xs)',
                color: 'var(--color-neutral-400)',
                marginBottom: '8px',
                padding: '0 14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {companyName}
              </div>
            )}
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-base)',
                fontWeight: 400,
                color: 'var(--color-neutral-400)',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: loggingOut ? 'not-allowed' : 'pointer',
                width: '100%',
                textAlign: 'left',
                transition: 'all 150ms ease',
                opacity: loggingOut ? 0.5 : 1,
                minHeight: '44px',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{loggingOut ? 'Saindo...' : 'Sair'}</span>
            </button>
          </div>
        </aside>
      </>
    )
  }

  // ─── Desktop Sidebar (original) ────────────────
  const sidebarWidth = collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'

  const sidebarStyle: CSSProperties = {
    width: sidebarWidth,
    minWidth: sidebarWidth,
    minHeight: '100vh',
    backgroundColor: 'var(--color-neutral-800)',
    color: 'var(--color-neutral-50)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94), min-width 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    overflow: 'hidden',
    position: 'fixed',
    top: 0,
    left: 0,
    bottom: 0,
    zIndex: 100,
  }

  const logoContainerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'space-between',
    padding: collapsed ? '20px 0' : '20px 20px',
    borderBottom: '1px solid var(--color-neutral-700)',
    minHeight: '64px',
  }

  const logoStyle: CSSProperties = {
    fontSize: '1.375rem',
    fontWeight: 700,
    letterSpacing: '-0.025em',
    color: 'var(--color-white)',
    display: collapsed ? 'none' : 'block',
    whiteSpace: 'nowrap',
  }

  const logoIconStyle: CSSProperties = {
    display: collapsed ? 'flex' : 'none',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'var(--color-primary-600)',
    color: 'var(--color-white)',
    fontSize: '1rem',
    fontWeight: 700,
  }

  const collapseButtonStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--color-neutral-400)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'color var(--transition-fast), background var(--transition-fast)',
  }

  const navStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: collapsed ? '16px 8px' : '16px 12px',
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
  }

  function linkStyle(isActive: boolean): CSSProperties {
    return {
      display: 'flex',
      alignItems: 'center',
      gap: collapsed ? '0' : '12px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      padding: collapsed ? '10px' : '10px 12px',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--font-sm)',
      fontWeight: isActive ? 600 : 400,
      color: isActive ? 'var(--color-white)' : 'var(--color-neutral-400)',
      backgroundColor: isActive ? 'var(--color-primary-600)' : 'transparent',
      textDecoration: 'none',
      transition: 'all 150ms ease',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
    }
  }

  const labelStyle: CSSProperties = {
    display: collapsed ? 'none' : 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  return (
    <aside style={sidebarStyle} data-sidebar-desktop>
      <div style={logoContainerStyle}>
        <span style={logoStyle}>Xpid</span>
        <span style={logoIconStyle}>X</span>
        <button
          style={collapseButtonStyle}
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? (
              <path d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>
      <nav style={navStyle}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              style={linkStyle(isActive)}
              title={collapsed ? item.label : undefined}
            >
              <NavIcon path={item.icon} />
              <span style={labelStyle}>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div style={{
        borderTop: '1px solid var(--color-neutral-700)',
        padding: collapsed ? '16px 8px' : '16px 12px',
      }}>
        {!collapsed && companyName && (
          <div style={{
            fontSize: 'var(--font-xs, 12px)',
            color: 'var(--color-neutral-400)',
            marginBottom: '8px',
            padding: '0 12px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {companyName}
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title={collapsed ? 'Sair' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? '0' : '12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px' : '10px 12px',
            borderRadius: 'var(--radius-md, 8px)',
            fontSize: 'var(--font-sm, 14px)',
            fontWeight: 400,
            color: 'var(--color-neutral-400)',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: loggingOut ? 'not-allowed' : 'pointer',
            width: '100%',
            textAlign: 'left',
            transition: 'all 150ms ease',
            opacity: loggingOut ? 0.5 : 1,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span>{loggingOut ? 'Saindo...' : 'Sair'}</span>}
        </button>
      </div>
    </aside>
  )
}
