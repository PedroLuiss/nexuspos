import React, { useState } from 'react'
import type { TabId } from '../router/tabs.config'
import { RouterContext } from './router-context'

export function HotkeysProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<TabId>('pos')

  return (
    <RouterContext.Provider value={{ activeTab, setActiveTab }}>{children}</RouterContext.Provider>
  )
}
