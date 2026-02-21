import type { CSSProperties, ReactNode } from 'react'
import { colors, fonts, radius, spacing } from '../styles/theme.js'

interface TableColumn<T> {
  key: string
  header: string
  render?: (row: T) => ReactNode
  width?: string
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  rows: T[]
  keyExtractor: (row: T) => string
  emptyMessage?: string
}

export function Table<T>({
  columns,
  rows,
  keyExtractor,
  emptyMessage = 'Nenhum registro encontrado',
}: TableProps<T>) {
  const wrapperStyle: CSSProperties = {
    width: '100%',
    overflowX: 'auto',
    borderRadius: radius.md,
    border: `1px solid ${colors.neutral[200]}`,
  }

  const tableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontFamily: fonts.family,
    fontSize: fonts.size.sm,
  }

  const thStyle: CSSProperties = {
    padding: `${spacing[3]} ${spacing[4]}`,
    textAlign: 'left',
    fontWeight: fonts.weight.medium,
    color: colors.neutral[600],
    backgroundColor: colors.neutral[50],
    borderBottom: `1px solid ${colors.neutral[200]}`,
    whiteSpace: 'nowrap',
  }

  const tdStyle: CSSProperties = {
    padding: `${spacing[3]} ${spacing[4]}`,
    color: colors.neutral[800],
    borderBottom: `1px solid ${colors.neutral[100]}`,
  }

  const emptyStyle: CSSProperties = {
    padding: spacing[8],
    textAlign: 'center',
    color: colors.neutral[400],
  }

  return (
    <div style={wrapperStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{ ...thStyle, width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={emptyStyle}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={keyExtractor(row)}>
                {columns.map((col) => (
                  <td key={col.key} style={tdStyle}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
