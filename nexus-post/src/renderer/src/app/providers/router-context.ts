import { createContext, useContext } from 'react'
import type { TabId } from '../router/tabs.config'

interface RouterContextType {
  activeTab: TabId
  setActiveTab: (tab: TabId) => void
}

export const RouterContext = createContext<RouterContextType>({
  activeTab: 'pos',
  setActiveTab: () => {}
})

export const useRouter = (): RouterContextType => useContext(RouterContext)
