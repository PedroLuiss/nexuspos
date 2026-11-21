import React from 'react'

export interface TabItem {
  id: string
  label: string
  hotkey?: string
}

interface NavigationTabsProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (id: string) => void
}

export function NavigationTabs({ tabs, activeTab, onTabChange }: NavigationTabsProps) {
  return (
    <div className="flex items-center gap-1 bg-[#F3F3F3] border-b border-gray-200 px-2 pt-2 select-none overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              relative px-4 py-2 text-sm font-medium transition-colors rounded-t-md outline-none whitespace-nowrap
              ${isActive 
                ? 'bg-white text-[#0067C0]' 
                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'}
            `}
          >
            {tab.label}
            {tab.hotkey && (
              <span className={`ml-2 kbd-badge ${isActive ? 'bg-[#EBF0F5] text-[#0067C0] border-[#0067C0]/30' : ''}`}>
                {tab.hotkey}
              </span>
            )}
            {/* Indicador de pestaña activa al estilo WinUI (borde inferior) */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0067C0]" />
            )}
          </button>
        )
      })}
    </div>
  )
}
