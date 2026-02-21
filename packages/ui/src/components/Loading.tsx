import type { CSSProperties } from 'react'
import { colors, spacing } from '../styles/theme.js'

type LoadingSize = 'sm' | 'md' | 'lg'

interface LoadingProps {
  size?: LoadingSize
}

const sizeMap: Record<LoadingSize, string> = {
  sm: '20px',
  md: '32px',
  lg: '48px',
}

export function Loading({ size = 'md' }: LoadingProps) {
  const dimension = sizeMap[size]

  const containerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
  }

  const spinnerStyle: CSSProperties = {
    width: dimension,
    height: dimension,
    border: `3px solid ${colors.neutral[200]}`,
    borderTopColor: colors.primary[600],
    borderRadius: '50%',
    animation: 'spid-spin 0.6s linear infinite',
  }

  return (
    <>
      <style>{`@keyframes spid-spin { to { transform: rotate(360deg) } }`}</style>
      <div style={containerStyle}>
        <div style={spinnerStyle} />
      </div>
    </>
  )
}
