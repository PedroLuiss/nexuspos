import React, { createContext, useContext, useState, useEffect } from 'react'
import { TABS_CONFIG, TabId } from '../router/tabs.config'

interface RouterContextType {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
}

const RouterContext = createContext<RouterContextType>({
  activeTab: 'pos',
  setActiveTab: () => {}
})

export const useRouter = () => useContext(RouterContext)

export function HotkeysProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<TabId>('pos')

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      // Ignorar hotkeys si el usuario está escribiendo en un input
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        // Excepción: F1-F7 generalmente deben funcionar siempre, pero para evitar conflictos
        // dependemos de la tecla exacta.
      }

      const targetTab = TABS_CONFIG.find(t => t.hotkey === e.key)
      if (targetTab) {
        e.preventDefault()
        setActiveTab(targetTab.id)
      }
    }
    
    window.addEventListener('keydown', handleGlobalKeys)
    return () => window.removeEventListener('keydown', handleGlobalKeys)
  }, [])

  return (
    <RouterContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </RouterContext.Provider>
  )
}
