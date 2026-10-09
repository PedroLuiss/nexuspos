import React from 'react'
import { useRouter } from './providers/HotkeysProvider'
import { TABS_CONFIG, TabId } from './router/tabs.config'
import { NavigationTabs } from '../shared/ui/NavigationTabs'

export function DashboardLayout({ children }: { children?: React.ReactNode }) {
  const { activeTab, setActiveTab } = useRouter()
  
  // Renderizado dinámico del componente asociado a la pestaña activa
  // Nota: Actualmente los componentes (POSView, etc.) requieren props en App.tsx. 
  // Esto está preparado para cuando migremos el estado a Zustand/TanStack Query.
  // Por ahora renderizamos `children` para retrocompatibilidad en la transición.
  const ActiveComponent = TABS_CONFIG.find(t => t.id === activeTab)?.component

  return (
    <div className="flex flex-col h-screen bg-[#F3F3F3] text-gray-900 font-sans overflow-hidden">
      {/* 1. Cabecera Fija (WinUI Style) */}
      <header className="h-10 flex items-center justify-between px-4 bg-white border-b border-gray-200 select-none shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-[#0067C0] rounded-sm flex items-center justify-center">
            <span className="text-white text-xs font-bold">N</span>
          </div>
          <h1 className="text-sm font-semibold text-gray-800">NexusPOS - Workspace</h1>
        </div>
        <div className="text-xs text-gray-500">
          Caja 01 • Admin
        </div>
      </header>

      {/* 2. Barra de Navegación (Tabs) */}
      <NavigationTabs 
        tabs={TABS_CONFIG}
        activeTab={activeTab}
        onTabChange={(id) => setActiveTab(id as TabId)}
      />

      {/* 3. Área de Contenido Principal */}
      <main className="flex-1 relative overflow-auto bg-white p-4">
        {/* Aquí podemos inyectar children en la transición, o usar el ActiveComponent puro cuando se use estado global */}
        {children}
      </main>

      {/* 4. Barra de Estado Inferior */}
      <footer className="h-7 flex items-center justify-between px-4 bg-[#0067C0] text-white text-[11px] select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
            Base de datos conectada (Local)
          </span>
          <span>Impresora ESC/POS: Lista</span>
        </div>
        <div>
          <span>{new Date().toLocaleDateString('es-MX')}</span>
        </div>
      </footer>
    </div>
  )
}

export default DashboardLayout
