import type { CSSProperties, ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BottomNav } from './BottomNav'

interface MobileLayoutProps {
  children: ReactNode
}

const ROOT_PATHS = ['/', '/vendas', '/clientes']

const PAGE_TITLES: Record<string, string> = {
  '/': 'Vendi',
  '/vendas': 'Vendas',
  '/vendas/nova': 'Nova Venda',
  '/clientes': 'Clientes',
  '/clientes/novo': 'Novo Cliente',
  '/fornecedores': 'Fornecedores',
  '/fornecedores/novo': 'Novo Fornecedor',
  '/produtos': 'Produtos',
  '/produtos/novo': 'Novo Produto',
  '/compras': 'Compras',
  '/compras/nova': 'Nova Compra',
  '/estoque': 'Estoque',
  '/estoque/contagem': 'Contagem',
  '/estoque/movimentacoes': 'Movimentacoes',
  '/financeiro': 'Financeiro',
  '/financeiro/contas': 'Contas',
  '/financeiro/lancamento': 'Novo Lancamento',
  '/financeiro/fechamento': 'Fechamento Mensal',
  '/inadimplentes': 'Inadimplentes',
  '/configuracoes': 'Configuracoes',
  '/menu': 'Menu',
}

function getPageTitle(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname]
  if (pathname.startsWith('/produtos/')) return 'Produto'
  if (pathname.startsWith('/clientes/')) return 'Cliente'
  if (pathname.startsWith('/fornecedores/')) return 'Fornecedor'
  if (pathname.startsWith('/vendas/')) return 'Venda'
  if (pathname.startsWith('/compras/')) return 'Compra'
  return 'Vendi'
}

function isRootPath(pathname: string): boolean {
  return ROOT_PATHS.includes(pathname)
}

export function MobileLayout({ children }: MobileLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const title = getPageTitle(location.pathname)
  const showBack = !isRootPath(location.pathname)

  const containerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
    backgroundColor: 'var(--bg)',
  }

  const headerStyle: CSSProperties = {
    position: 'sticky',
    top: 0,
    backgroundColor: 'var(--primary)',
    color: 'var(--neutral-0)',
    padding: '0 var(--sp-4)',
    paddingTop: 'max(var(--sp-3), var(--safe-top))',
    paddingBottom: 'var(--sp-3)',
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--sp-3)',
    minHeight: '56px',
    zIndex: 'var(--z-nav)',
  }

  const backBtnStyle: CSSProperties = {
    background: 'none',
    border: 'none',
    color: 'var(--neutral-0)',
    cursor: 'pointer',
    padding: 'var(--sp-1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-md)',
    transition: 'background-color var(--transition-fast)',
    flexShrink: 0,
  }

  const titleStyle: CSSProperties = {
    fontSize: 'var(--font-lg)',
    fontWeight: 700,
    flex: 1,
    lineHeight: 1.2,
  }

  const contentStyle: CSSProperties = {
    flex: 1,
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
  }

  return (
    <div style={containerStyle}>
      <header style={headerStyle}>
        {showBack && (
          <button
            style={backBtnStyle}
            onClick={() => navigate(-1)}
            aria-label="Voltar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        <span style={titleStyle}>{title}</span>
      </header>
      <main style={contentStyle}>{children}</main>
      <BottomNav />
    </div>
  )
}
