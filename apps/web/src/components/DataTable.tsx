'use client'

import { type CSSProperties, type ReactNode, useCallback, useMemo, useState } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

// ─── Types ──────────────────────────────────────────────

export interface DataTableColumn<T> {
  key: string
  header: string
  render?: (row: T, key: string, index: number) => ReactNode
  width?: string
  sortable?: boolean
  align?: 'left' | 'center' | 'right'
  /** Show this column in mobile card view (first 3 by default) */
  mobileVisible?: boolean
  /** Use as card title in mobile view */
  mobileTitle?: boolean
  /** Use as card subtitle in mobile view */
  mobileSubtitle?: boolean
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  searchable?: boolean
  searchPlaceholder?: string
  searchKeys?: string[]
  pageSize?: number
  loading?: boolean
  emptyIcon?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
  actions?: ReactNode
  /** Custom mobile card renderer — replaces default card layout */
  renderMobileCard?: (row: T, index: number) => ReactNode
}

type SortDirection = 'asc' | 'desc'

// ─── Component ──────────────────────────────────────────

export function DataTable<T>({
  columns,
  rows,
  keyExtractor,
  onRowClick,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  searchKeys,
  pageSize = 20,
  loading = false,
  emptyIcon,
  emptyTitle = 'Nenhum registro encontrado',
  emptyDescription,
  actions,
  renderMobileCard,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [page, setPage] = useState(0)
  const { isMobile } = useMediaQuery()

  // Filter
  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows
    const term = search.toLowerCase()
    const keys = searchKeys ?? columns.map((c) => c.key)
    return rows.filter((row) => {
      const rec = row as Record<string, unknown>
      return keys.some((key) => {
        const val = rec[key]
        if (val == null) return false
        return String(val).toLowerCase().includes(term)
      })
    })
  }, [rows, search, searchKeys, columns])

  // Sort
  const sortedRows = useMemo(() => {
    if (!sortKey) return filteredRows
    const sorted = [...filteredRows].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey]
      const bVal = (b as Record<string, unknown>)[sortKey]
      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      const aStr = String(aVal).toLowerCase()
      const bStr = String(bVal).toLowerCase()
      if (aStr < bStr) return sortDir === 'asc' ? -1 : 1
      if (aStr > bStr) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredRows, sortKey, sortDir])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const paginatedRows = useMemo(() => {
    const start = page * pageSize
    return sortedRows.slice(start, start + pageSize)
  }, [sortedRows, page, pageSize])

  // Reset page when search changes
  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPage(0)
  }, [])

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(0)
  }, [sortKey])

  // ─── Styles ─────────────────────────────────────

  const containerStyle: CSSProperties = {
    backgroundColor: 'var(--color-white)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-sm)',
  }

  const toolbarStyle: CSSProperties = {
    display: 'flex',
    alignItems: isMobile ? 'stretch' : 'center',
    justifyContent: 'space-between',
    padding: isMobile ? '12px' : '16px 20px',
    gap: isMobile ? '8px' : '12px',
    borderBottom: '1px solid var(--color-border)',
    flexDirection: isMobile ? 'column' : 'row',
  }

  const searchWrapperStyle: CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    maxWidth: isMobile ? '100%' : '320px',
    flex: 1,
  }

  const searchIconStyle: CSSProperties = {
    position: 'absolute',
    left: '12px',
    color: 'var(--color-neutral-400)',
    pointerEvents: 'none',
    display: 'flex',
  }

  const searchInputStyle: CSSProperties = {
    width: '100%',
    padding: isMobile ? '10px 12px 10px 36px' : '8px 12px 8px 36px',
    fontSize: isMobile ? '16px' : 'var(--font-sm)',
    color: 'var(--color-neutral-800)',
    backgroundColor: 'var(--color-neutral-50)',
    border: '1px solid var(--color-neutral-200)',
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
  }

  const tableWrapperStyle: CSSProperties = {
    overflowX: 'auto',
  }

  const tableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 'var(--font-sm)',
  }

  function thStyle(col: DataTableColumn<T>): CSSProperties {
    const isSorted = sortKey === col.key
    return {
      padding: '12px 20px',
      textAlign: (col.align ?? 'left') as CSSProperties['textAlign'],
      fontWeight: 500,
      color: isSorted ? 'var(--color-primary-600)' : 'var(--color-neutral-500)',
      backgroundColor: 'var(--color-neutral-50)',
      borderBottom: '1px solid var(--color-border)',
      whiteSpace: 'nowrap',
      cursor: col.sortable !== false ? 'pointer' : 'default',
      userSelect: 'none',
      transition: 'color var(--transition-fast)',
      width: col.width,
      fontSize: 'var(--font-xs)',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }
  }

  function tdStyle(col: DataTableColumn<T>): CSSProperties {
    return {
      padding: '12px 20px',
      color: 'var(--color-neutral-800)',
      borderBottom: '1px solid var(--color-neutral-100)',
      textAlign: (col.align ?? 'left') as CSSProperties['textAlign'],
      whiteSpace: 'nowrap',
    }
  }

  const rowStyle: CSSProperties = {
    transition: 'background-color var(--transition-fast)',
    cursor: onRowClick ? 'pointer' : 'default',
  }

  const paginationStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: isMobile ? '10px 12px' : '12px 20px',
    borderTop: '1px solid var(--color-border)',
    fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-500)',
    gap: '8px',
    flexWrap: 'wrap',
  }

  const paginationBtnStyle = (disabled: boolean): CSSProperties => ({
    padding: isMobile ? '8px 16px' : '6px 12px',
    fontSize: 'var(--font-sm)',
    fontWeight: 500,
    color: disabled ? 'var(--color-neutral-300)' : 'var(--color-neutral-600)',
    backgroundColor: 'var(--color-white)',
    border: `1px solid ${disabled ? 'var(--color-neutral-200)' : 'var(--color-neutral-300)'}`,
    borderRadius: 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all var(--transition-fast)',
    minHeight: isMobile ? '44px' : undefined,
  })

  const emptyContainerStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: isMobile ? '32px 16px' : '48px 24px',
    textAlign: 'center',
  }

  const emptyIconStyle: CSSProperties = {
    fontSize: '2.5rem',
    color: 'var(--color-neutral-300)',
    marginBottom: '16px',
  }

  const emptyTitleStyle: CSSProperties = {
    fontSize: 'var(--font-base)',
    fontWeight: 600,
    color: 'var(--color-neutral-600)',
    margin: 0,
    marginBottom: '4px',
  }

  const emptyDescStyle: CSSProperties = {
    fontSize: 'var(--font-sm)',
    color: 'var(--color-neutral-400)',
    margin: 0,
  }

  // Skeleton loading
  if (loading) {
    return (
      <div style={containerStyle}>
        {(searchable || actions) && <div style={toolbarStyle}><div /></div>}
        <div style={{ padding: '0' }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '16px',
                padding: isMobile ? '12px' : '14px 20px',
                borderBottom: '1px solid var(--color-neutral-100)',
              }}
            >
              {(isMobile ? [columns[0], columns[1]].filter(Boolean) : columns).map((col) => (
                <div
                  key={col!.key}
                  className="skeleton skeleton-text"
                  style={{
                    flex: 1,
                    height: '16px',
                    maxWidth: col!.width ?? '200px',
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const showPagination = sortedRows.length > pageSize

  // ─── Mobile Card View ──────────────────────────

  if (isMobile) {
    // Determine which columns show in cards
    const titleCol = columns.find((c) => c.mobileTitle) ?? columns[0]
    const subtitleCol = columns.find((c) => c.mobileSubtitle) ?? columns[1]
    const lastCol = columns.length > 2 ? columns[columns.length - 1] : null
    const visibleCols = columns.filter((c) => c.mobileVisible)
    const extraCols = visibleCols.length > 0
      ? visibleCols.filter((c) => c !== titleCol && c !== subtitleCol && c !== lastCol)
      : columns.slice(2, 5).filter((c) => c !== titleCol && c !== subtitleCol && c !== lastCol)

    return (
      <div style={containerStyle}>
        {(searchable || actions) && (
          <div style={toolbarStyle}>
            {searchable && (
              <div style={searchWrapperStyle}>
                <span style={searchIconStyle}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder={searchPlaceholder}
                  style={searchInputStyle}
                />
              </div>
            )}
            {actions && <div style={{ display: 'flex', gap: '8px' }}>{actions}</div>}
          </div>
        )}

        {/* Card list */}
        <div style={{ padding: '0' }}>
          {paginatedRows.length === 0 ? (
            <div style={emptyContainerStyle}>
              {emptyIcon && <div style={emptyIconStyle}>{emptyIcon}</div>}
              <h3 style={emptyTitleStyle}>{emptyTitle}</h3>
              {emptyDescription && <p style={emptyDescStyle}>{emptyDescription}</p>}
            </div>
          ) : (
            paginatedRows.map((row, rowIndex) => {
              const globalIndex = page * pageSize + rowIndex
              return (
                <div
                  key={keyExtractor(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--color-neutral-100)',
                    cursor: onRowClick ? 'pointer' : 'default',
                    transition: 'background-color var(--transition-fast)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  {renderMobileCard ? renderMobileCard(row, globalIndex) : (
                    <>
                      {/* Title row */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                      }}>
                        <div style={{
                          fontWeight: 600,
                          fontSize: 'var(--font-sm)',
                          color: 'var(--color-neutral-900)',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {titleCol?.render
                            ? titleCol.render(row, titleCol.key, globalIndex)
                            : String((row as Record<string, unknown>)[titleCol?.key ?? ''] ?? '')}
                        </div>
                        {/* Show last column value (often status or total) as badge */}
                        {columns.length > 2 && (() => {
                          const lastCol = columns[columns.length - 1]!
                          return (
                            <div style={{ flexShrink: 0 }}>
                              {lastCol.render
                                ? lastCol.render(row, lastCol.key, globalIndex)
                                : String((row as Record<string, unknown>)[lastCol.key] ?? '')}
                            </div>
                          )
                        })()}
                      </div>

                      {/* Subtitle + extra fields */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        flexWrap: 'wrap',
                      }}>
                        {subtitleCol && (
                          <span style={{
                            fontSize: 'var(--font-xs)',
                            color: 'var(--color-neutral-500)',
                          }}>
                            {subtitleCol.render
                              ? subtitleCol.render(row, subtitleCol.key, globalIndex)
                              : String((row as Record<string, unknown>)[subtitleCol.key] ?? '')}
                          </span>
                        )}
                        {extraCols.map((col) => (
                          <span key={col.key} style={{
                            fontSize: 'var(--font-xs)',
                            color: 'var(--color-neutral-400)',
                          }}>
                            {col.render
                              ? col.render(row, col.key, globalIndex)
                              : String((row as Record<string, unknown>)[col.key] ?? '')}
                          </span>
                        ))}
                      </div>

                      {/* Chevron indicator for clickable rows */}
                      {onRowClick && (
                        <div style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--color-neutral-300)',
                          display: 'none', // hidden but available
                        }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {showPagination && (
          <div style={paginationStyle}>
            <span style={{ fontSize: 'var(--font-xs)' }}>
              {sortedRows.length} registro{sortedRows.length !== 1 ? 's' : ''}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                style={paginationBtnStyle(page === 0)}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Anterior
              </button>
              <span style={{ padding: '0 4px', fontWeight: 500, color: 'var(--color-neutral-700)', fontSize: 'var(--font-xs)' }}>
                {page + 1}/{totalPages}
              </span>
              <button
                style={paginationBtnStyle(page >= totalPages - 1)}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Proximo
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── Desktop Table View ────────────────────────

  return (
    <div style={containerStyle}>
      {(searchable || actions) && (
        <div style={toolbarStyle}>
          {searchable ? (
            <div style={searchWrapperStyle}>
              <span style={searchIconStyle}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={searchPlaceholder}
                style={searchInputStyle}
              />
            </div>
          ) : (
            <div />
          )}
          {actions && <div style={{ display: 'flex', gap: '8px' }}>{actions}</div>}
        </div>
      )}

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={thStyle(col)}
                  onClick={col.sortable !== false ? () => handleSort(col.key) : undefined}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {col.header}
                    {col.sortable !== false && sortKey === col.key && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{
                          transform: sortDir === 'desc' ? 'rotate(180deg)' : 'none',
                          transition: 'transform var(--transition-fast)',
                        }}
                      >
                        <path d="M18 15l-6-6-6 6" />
                      </svg>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div style={emptyContainerStyle}>
                    {emptyIcon && <div style={emptyIconStyle}>{emptyIcon}</div>}
                    <h3 style={emptyTitleStyle}>{emptyTitle}</h3>
                    {emptyDescription && <p style={emptyDescStyle}>{emptyDescription}</p>}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, rowIndex) => (
                <tr
                  key={keyExtractor(row)}
                  style={rowStyle}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onMouseEnter={(e) => {
                    if (onRowClick) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-neutral-50)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = ''
                  }}
                >
                  {columns.map((col) => (
                    <td key={col.key} style={tdStyle(col)}>
                      {col.render
                        ? col.render(row, col.key, page * pageSize + rowIndex)
                        : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div style={paginationStyle}>
          <span>
            {sortedRows.length} registro{sortedRows.length !== 1 ? 's' : ''}
            {search && ` (filtrado${sortedRows.length !== 1 ? 's' : ''})`}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              style={paginationBtnStyle(page === 0)}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Anterior
            </button>
            <span style={{ padding: '0 8px', fontWeight: 500, color: 'var(--color-neutral-700)' }}>
              {page + 1} / {totalPages}
            </span>
            <button
              style={paginationBtnStyle(page >= totalPages - 1)}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Proximo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
