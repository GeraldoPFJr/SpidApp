import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { colors, radius, shadows, spacing } from '../styles/theme.js'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'sm' | 'md' | 'lg'
}

const paddingMap = {
  sm: spacing[3],
  md: spacing[4],
  lg: spacing[6],
} as const

export function Card({ children, padding = 'md', style, ...props }: CardProps) {
  const cardStyle: CSSProperties = {
    backgroundColor: colors.neutral[0],
    borderRadius: radius.lg,
    boxShadow: shadows.sm,
    border: `1px solid ${colors.neutral[200]}`,
    padding: paddingMap[padding],
    ...style,
  }

  return (
    <div style={cardStyle} {...props}>
      {children}
    </div>
  )
}
