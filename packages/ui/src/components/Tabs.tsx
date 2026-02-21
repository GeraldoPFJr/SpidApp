import { type CSSProperties, useState } from 'react'
import { colors, fonts, spacing } from '../styles/theme.js'

interface Tab {
  key: string
  label: string
  content: React.ReactNode
}

interface TabsProps {
  tabs: Tab[]
  defaultTab?: string
}

export function Tabs({ tabs, defaultTab }: TabsProps) {
  const [activeKey, setActiveKey] = useState(defaultTab ?? tabs[0]?.key ?? '')

  const headerStyle: CSSProperties = {
    display: 'flex',
    borderBottom: `1px solid ${colors.neutral[200]}`,
    gap: 0,
  }

  function tabStyle(isActive: boolean): CSSProperties {
    return {
      padding: `${spacing[3]} ${spacing[4]}`,
      fontSize: fonts.size.sm,
      fontWeight: isActive ? fonts.weight.semibold : fonts.weight.normal,
      color: isActive ? colors.primary[600] : colors.neutral[500],
      background: 'none',
      border: 'none',
      borderBottom: isActive ? `2px solid ${colors.primary[600]}` : '2px solid transparent',
      cursor: 'pointer',
      marginBottom: '-1px',
    }
  }

  const contentStyle: CSSProperties = {
    padding: `${spacing[4]} 0`,
  }

  const activeTab = tabs.find((t) => t.key === activeKey)

  return (
    <div>
      <div style={headerStyle}>
        {tabs.map((tab) => (
          <button key={tab.key} style={tabStyle(tab.key === activeKey)} onClick={() => setActiveKey(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>
      <div style={contentStyle}>{activeTab?.content}</div>
    </div>
  )
}
