import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from './providers/HotkeysProvider'
import { TABS_CONFIG, TabId } from './router/tabs.config'
import { NavigationTabs } from '../shared/ui/NavigationTabs'
import AuthModal from '../shared/ui/AuthModal'
import { LogOut } from '../shared/icons/Icons'
import { canAccessTab } from '../shared/lib/permissions'
import type { User } from '@shared/contracts'

  interface DashboardLayoutProps {
    children?: React.ReactNode
    currentUser?: User | null
    onLogout?: () => void
  }

  const DEMO_USER: User = {
    id: 'usr-demo',
    username: 'carlos.morales',
    email: 'carlos.morales@nexuspos.pe',
    name: 'Carlos Morales',
    role: 'CASHIER',
    active: true,
    station: 'CAJA-01'
  }

  export function DashboardLayout({ children, currentUser, onLogout }: DashboardLayoutProps): React.JSX.Element {
    const { activeTab, setActiveTab } = useRouter()
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
    // Nombre del operador seleccionado en el Pinpad (override temporal de la sesión mostrada).
    const [manualName, setManualName] = useState<string | null>(null)

    const baseUser = currentUser ?? DEMO_USER
    const user: User = manualName ? { ...baseUser, name: manualName } : baseUser

    // RBAC: solo se muestran los módulos autorizados para la sesión actual.
    const allowedTabs = useMemo(
      () => TABS_CONFIG.filter((tab) => canAccessTab(user, tab.id)),
      [user]
    )

    useEffect(() => {
      if (!allowedTabs.some((tab) => tab.id === activeTab)) {
        setActiveTab((allowedTabs[0]?.id ?? 'pos') as TabId)
      }
    }, [allowedTabs, activeTab, setActiveTab])

    return (
      <div className="flex flex-col h-screen bg-[#F3F3F3] text-[#1B1B1B] font-sans overflow-hidden select-none">
        {/* 1. Top Command Bar (Stitch 48px height specification) */}
        <header className="h-12 flex items-center justify-between px-4 bg-white border-b border-[#E5E5E5] shadow-[0_1px_2px_rgba(0,0,0,0.03)] z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#0067C0] rounded-[4px] flex items-center justify-center shadow-xs">
              <span className="text-white text-xs font-extrabold tracking-tight">NX</span>
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-[#1B1B1B] tracking-tight flex items-center gap-2">
                <span>NexusPOS Desktop</span>
                <span className="text-[10px] font-mono bg-[#EBF0F5] text-[#0067C0] border border-[#0067C0]/30 px-1.5 py-0.2 rounded font-semibold">
                  v2.4.0
                </span>
              </h1>
              <p className="text-[11px] text-[#717783] font-medium">Punto de Venta & Administración Comercial</p>
            </div>
          </div>

          {/* Live System Context Indicators */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 bg-[#F9F9F9] border border-[#E5E5E5] px-2.5 py-1 rounded-[4px]">
              <div className="w-2 h-2 rounded-full bg-[#107C41] animate-pulse"></div>
              <span className="font-semibold text-[#1B1B1B]">{user.station ?? 'CAJA-01'}</span>
              <span className="text-[#717783]">•</span>
              <span className="text-[#5C5C5C] font-mono">TURNO ACTIVO</span>
            </div>

            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-2 bg-[#F9F9F9] hover:bg-[#EBF0F5] border border-[#E5E5E5] px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer"
              title="Cambiar cajero / Supervisor Override"
            >
              <span className="text-[#717783]">{user.role === 'ADMIN' ? 'Admin:' : 'Cajero:'}</span>
              <span className="font-bold text-[#0067C0] flex items-center gap-1">
                <span>{user.name}</span>
                <span className="kbd-badge text-[9px] text-[#0067C0] bg-[#0067C0]/10 border-[#0067C0]/20">LOCK</span>
              </span>
            </button>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 bg-[#FDE8E8] hover:bg-[#FCD3D3] text-[#C42B1C] border border-[#F8B4B4] px-2.5 py-1 rounded-[4px] transition-colors cursor-pointer font-semibold"
                title="Cerrar Sesión / Salir a Login"
              >
                <LogOut size={13} />
                <span>Salir</span>
              </button>
            )}
          </div>
        </header>

        {/* 2. Command Bar Tabs Navigation */}
        <NavigationTabs
          tabs={allowedTabs}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as TabId)}
        />

        {/* 3. Main Workspace Area (Stitch Mica Canvas #F3F3F3) */}
        <main className="flex-1 relative overflow-hidden bg-[#F3F3F3] p-3">
          {children}
        </main>

        {/* 4. WinUI Status Bar Footer */}
        <footer className="h-7 flex items-center justify-between px-4 bg-[#0067C0] text-white text-[11px] font-medium shrink-0">
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>SQLite Local DB: Conectado</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Impresora 80mm: Lista</span>
            </span>
            <span className="flex items-center gap-1.5 text-blue-100">
              <span>Báscula COM1: 9600 bps</span>
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span>MODO TECLADO (HOTKEYS ON)</span>
            <span>•</span>
            <span>{new Date().toLocaleDateString('es-MX', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</span>
          </div>
        </footer>

        {/* 5. Auth / Pinpad Modal (Stitch Authentication Prototype) */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={(u) => setManualName(u.name)}
        />
      </div>
    )
  }

  export default DashboardLayout
