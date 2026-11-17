import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from './providers/HotkeysProvider'
import { TABS_CONFIG, TabId } from './router/tabs.config'
import { NavigationTabs } from '../shared/ui/NavigationTabs'
import OperatorSwitchModal from '../features/auth/components/OperatorSwitchModal'
import { Lock, LogOut, RefreshCw } from '../shared/icons/Icons'
import { canAccessTab } from '../shared/lib/permissions'
import logoBanner from '@resources/logobanner.png'
import type { User } from '@shared/contracts'

interface DashboardLayoutProps {
  children?: React.ReactNode
  currentUser?: User | null
  onLogout?: () => void | Promise<void>
  /** Cambio de operador validado por PIN (LOCK de estación). */
  onOperatorSwitch?: (user: User) => void
  /** Indica si el turno de caja está abierto para pintar el estado real. */
  cashShiftOpen?: boolean
  isLoggingOut?: boolean
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

const ROLE_LABELS: Record<User['role'], string> = {
  ADMIN: 'Admin:',
  SUPERVISOR: 'Supervisor:',
  CASHIER: 'Cajero:'
}

export function DashboardLayout({
  children,
  currentUser,
  onLogout,
  onOperatorSwitch,
  cashShiftOpen = false,
  isLoggingOut = false
}: DashboardLayoutProps): React.JSX.Element {
  const { activeTab, setActiveTab } = useRouter()
  const [isLockModalOpen, setIsLockModalOpen] = useState(false)

  const user = currentUser ?? DEMO_USER

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

  const canOpenCash = canAccessTab(user, 'cash')
  const handleGoToCash = (): void => {
    if (canOpenCash) setActiveTab('cash')
  }

  const handleLogoutClick = (): void => {
    if (isLoggingOut) return
    void onLogout?.()
  }

  return (
    <div className="flex flex-col h-screen bg-[#F3F3F3] text-[#1B1B1B] font-sans overflow-hidden select-none">
      {/* 1. Top Command Bar (Stitch 48px height specification) */}
      <header className="h-12 flex items-center justify-between px-4 bg-white border-b border-[#E5E5E5] shadow-[0_1px_2px_rgba(0,0,0,0.03)] z-20 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={logoBanner}
            alt="NexusPOS — Diseñado para crecer contigo"
            draggable={false}
            className="h-9 w-auto max-w-[220px] object-contain"
          />
        </div>

        {/* Live System Context Indicators */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleGoToCash}
            disabled={!canOpenCash}
            title={
              canOpenCash ? 'Ver corte de caja y turno [F4]' : 'Sin permiso para el módulo de caja'
            }
            className={`flex items-center gap-2 rounded-[4px] border px-2.5 py-1 transition-colors ${
              canOpenCash
                ? 'cursor-pointer border-[#E5E5E5] bg-[#F9F9F9] hover:border-[#0067C0]/40 hover:bg-[#EBF0F5]'
                : 'cursor-default border-[#E5E5E5] bg-[#F9F9F9] opacity-70'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                cashShiftOpen ? 'bg-[#107C41] animate-pulse' : 'bg-[#C42B1C]'
              }`}
            />
            <span className="font-semibold text-[#1B1B1B]">{user.station ?? 'CAJA-01'}</span>
            <span className="text-[#717783]">•</span>
            <span className="font-mono text-[10px] text-[#5C5C5C]">
              {cashShiftOpen ? 'TURNO ACTIVO' : 'SIN TURNO'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsLockModalOpen(true)}
            className="flex items-center gap-2 rounded-[4px] border border-[#E5E5E5] bg-[#F9F9F9] px-2.5 py-1 transition-colors hover:border-[#0067C0]/40 hover:bg-[#EBF0F5] cursor-pointer"
            title="Bloquear estación / cambiar cajero con PIN"
          >
            <span className="text-[#717783]">{ROLE_LABELS[user.role] ?? 'Cajero:'}</span>
            <span className="flex items-center gap-1 font-bold text-[#0067C0]">
              <span className="max-w-[140px] truncate">{user.name}</span>
              <span className="kbd-badge gap-1 border-[#0067C0]/20 bg-[#0067C0]/10 text-[9px] text-[#0067C0]">
                <Lock size={9} />
                LOCK
              </span>
            </span>
          </button>

          {onLogout && (
            <button
              type="button"
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
              className="flex items-center gap-1.5 rounded-[4px] border border-[#F8B4B4] bg-[#FDE8E8] px-2.5 py-1 font-semibold text-[#C42B1C] transition-colors hover:bg-[#FCD3D3] disabled:cursor-wait disabled:opacity-70 cursor-pointer"
              title="Cerrar Sesión / Salir a Login"
            >
              {isLoggingOut ? <RefreshCw size={13} className="animate-spin" /> : <LogOut size={13} />}
              <span>{isLoggingOut ? 'Saliendo…' : 'Salir'}</span>
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
      <main className="flex-1 relative overflow-hidden bg-[#F3F3F3] p-3">{children}</main>

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

      {/* 5. Candado de estación (LOCK) con validación real de PIN (IPC auth) */}
      <OperatorSwitchModal
        isOpen={isLockModalOpen}
        currentUser={user}
        onClose={() => setIsLockModalOpen(false)}
        onSuccess={(nextUser) => onOperatorSwitch?.(nextUser)}
      />
    </div>
  )
}

export default DashboardLayout
