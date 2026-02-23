import type { CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../../hooks/useApi'
import { formatBRL, getCurrentMonth, formatMonthLabel } from '../../lib/format'
import type { Account, FinanceEntry } from '@xpid/shared'

interface AccountSummary extends Account {
  balance: number
  monthIn: number
  monthOut: number
}

interface FinanceEntryWithCategory extends FinanceEntry {
  categoryName: string | null
  accountName: string
}

export function FinanceOverviewPage() {
  const navigate = useNavigate()
  const month = getCurrentMonth()
  const { data: accounts, loading: loadingAccounts, error: errorAccounts } = useApi<AccountSummary[]>('/accounts/summary')
  const { data: entries, loading: loadingEntries, error: errorEntries } = useApi<FinanceEntryWithCategory[]>(`/finance/entries?month=${month}&limit=10`)

  const pageStyle: CSSProperties = { padding: 'var(--sp-4)', paddingBottom: '96px', display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }
  const sectionStyle: CSSProperties = { backgroundColor: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--sp-4)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }
  const sectionTitleStyle: CSSProperties = { fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }

  const loading = loadingAccounts || loadingEntries
  if (loading) {
    return <div style={pageStyle}>{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton skeleton-card" style={{ height: '80px' }} />)}</div>
  }

  const TYPE_LABELS: Record<string, string> = {
    EXPENSE: 'Despesa', INCOME: 'Receita', APORTE: 'Aporte', RETIRADA: 'Retirada', TRANSFER: 'Transferencia',
  }

  const apiError = errorAccounts || errorEntries

  return (
    <div style={pageStyle} className="animate-fade-in">
      {apiError && (
        <div className="alert alert-danger">
          <span>Erro ao carregar dados financeiros: {apiError}</span>
        </div>
      )}

      {/* Acoes rapidas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-2)' }}>
        <button className="btn btn-danger btn-block btn-sm" onClick={() => navigate('/financeiro/lancamento?type=EXPENSE')}>
          Nova Despesa
        </button>
        <button className="btn btn-success btn-block btn-sm" onClick={() => navigate('/financeiro/lancamento?type=INCOME')}>
          Nova Receita
        </button>
        <button className="btn btn-secondary btn-block btn-sm" onClick={() => navigate('/financeiro/lancamento?type=APORTE')}>
          Aporte
        </button>
        <button className="btn btn-secondary btn-block btn-sm" onClick={() => navigate('/financeiro/lancamento?type=RETIRADA')}>
          Retirada
        </button>
      </div>

      {/* Contas */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={sectionTitleStyle}>Contas</span>
          <button
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 'var(--font-sm)', fontWeight: 500 }}
            onClick={() => navigate('/financeiro/contas')}
          >
            Ver todas
          </button>
        </div>
        {accounts?.map((acc) => (
          <div key={acc.id} style={{
            padding: 'var(--sp-3)', backgroundColor: 'var(--neutral-50)', borderRadius: 'var(--radius-md)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-2)' }}>
              <span style={{ fontWeight: 600, fontSize: 'var(--font-base)' }}>{acc.name}</span>
              <span style={{ fontWeight: 700, fontSize: 'var(--font-lg)', color: acc.balance >= 0 ? 'var(--text-primary)' : 'var(--danger-600)' }}>
                {formatBRL(acc.balance)}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              <span>Entradas: <strong style={{ color: 'var(--success-600)' }}>{formatBRL(acc.monthIn)}</strong></span>
              <span>Saidas: <strong style={{ color: 'var(--danger-600)' }}>{formatBRL(acc.monthOut)}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Lancamentos recentes */}
      {entries && entries.length > 0 && (
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={sectionTitleStyle}>Lancamentos - {formatMonthLabel(month)}</span>
            <button
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: 'var(--font-sm)', fontWeight: 500 }}
              onClick={() => navigate('/financeiro/fechamento')}
            >
              Fechamento
            </button>
          </div>
          {entries.map((entry) => {
            const isIncome = entry.type === 'INCOME' || entry.type === 'APORTE'
            return (
              <div key={entry.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 'var(--sp-2) 0', borderBottom: '1px solid var(--border)',
              }}>
                <div>
                  <span style={{ fontSize: 'var(--font-sm)', fontWeight: 500, display: 'block' }}>
                    {entry.categoryName ?? TYPE_LABELS[entry.type] ?? entry.type}
                  </span>
                  <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    {entry.accountName}
                  </span>
                </div>
                <span style={{
                  fontSize: 'var(--font-sm)', fontWeight: 600,
                  color: isIncome ? 'var(--success-600)' : 'var(--danger-600)',
                }}>
                  {isIncome ? '+' : '-'}{formatBRL(entry.amount)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
