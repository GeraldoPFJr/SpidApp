'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { CSSProperties } from 'react'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/vendas', label: 'Vendas' },
  { href: '/produtos', label: 'Produtos' },
  { href: '/clientes', label: 'Clientes' },
  { href: '/fornecedores', label: 'Fornecedores' },
  { href: '/compras', label: 'Compras' },
  { href: '/estoque', label: 'Estoque' },
  { href: '/financeiro', label: 'Financeiro' },
  { href: '/inadimplentes', label: 'Inadimplentes' },
  { href: '/configuracoes', label: 'Configuracoes' },
] as const

export function Sidebar() {
  const pathname = usePathname()

  const sidebarStyle: CSSProperties = {
    width: '240px',
    minHeight: '100vh',
    backgroundColor: '#1F2937',
    color: '#F9FAFB',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0',
  }

  const logoStyle: CSSProperties = {
    fontSize: '1.5rem',
    fontWeight: 700,
    padding: '0 24px 24px',
    borderBottom: '1px solid #374151',
    marginBottom: '16px',
  }

  const navStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    padding: '0 8px',
  }

  function linkStyle(isActive: boolean): CSSProperties {
    return {
      display: 'block',
      padding: '10px 16px',
      borderRadius: '8px',
      fontSize: '0.875rem',
      fontWeight: isActive ? 600 : 400,
      color: isActive ? '#FFFFFF' : '#9CA3AF',
      backgroundColor: isActive ? '#2563EB' : 'transparent',
      textDecoration: 'none',
      transition: 'all 150ms ease',
    }
  }

  return (
    <aside style={sidebarStyle}>
      <div style={logoStyle}>Vendi</div>
      <nav style={navStyle}>
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} style={linkStyle(pathname.startsWith(item.href))}>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
