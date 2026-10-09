import React from 'react'
import { ActiveTab } from '../shared/types/domain'
import {
  ShoppingCart,
  Package,
  ClipboardList,
  Wallet,
  Users,
  BarChart3,
  Settings
} from '../shared/icons/Icons'

interface NavigationTabsProps {
  activeTab: ActiveTab
  onTabChange: (tab: ActiveTab) => void
  cartItemsCount?: number
  productsCount?: number
  suspendedSalesCount?: number
  pendingDebtsCount?: number
}

interface TabItem {
  id: ActiveTab
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  shortcut: string
  badge?: number
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onTabChange,
  cartItemsCount = 0,
  productsCount = 0,
  suspendedSalesCount = 0,
  pendingDebtsCount = 0
}) => {
  const tabs: TabItem[] = [
    {
      id: 'pos',
      label: 'Punto de Venta',
      icon: ShoppingCart,
      shortcut: 'F1',
      badge: cartItemsCount > 0 ? cartItemsCount : undefined
    },
    {
      id: 'products',
      label: 'Inventario & Productos',
      icon: Package,
      shortcut: 'F2',
      badge: productsCount > 0 ? productsCount : undefined
    },
    {
      id: 'kardex',
      label: 'Kardex Auditoría',
      icon: ClipboardList,
      shortcut: 'F3'
    },
    {
      id: 'cash',
      label: 'Caja & Cortes',
      icon: Wallet,
      shortcut: 'F4'
    },
    {
      id: 'customers',
      label: 'Clientes & Créditos',
      icon: Users,
      shortcut: 'F5',
      badge: pendingDebtsCount > 0 ? pendingDebtsCount : undefined
    },
    {
      id: 'reports',
      label: 'Reportes & Métricas',
      icon: BarChart3,
      shortcut: 'F6'
    },
    {
      id: 'settings',
      label: 'Ajustes',
      icon: Settings,
      shortcut: 'F7'
    }
  ]

  return (
    <div className="flex items-center justify-between px-3 bg-[#F3F3F3] border-b border-[#E5E5E5] select-none overflow-x-auto h-10">
      <div className="flex items-center gap-1 h-full pt-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex items-center gap-2 px-3.5 h-[34px] text-xs font-semibold transition-all rounded-t-[4px] outline-none cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-white text-[#0067C0] border-t-2 border-t-[#0067C0] border-x border-[#E5E5E5] shadow-[0_-1px_3px_rgba(0,0,0,0.04)] -mb-[1px]'
                  : 'text-[#5C5C5C] hover:text-[#1B1B1B] hover:bg-[#EBEBEB] border-t-2 border-t-transparent'
              }`}
            >
              <Icon
                size={14}
                className={isActive ? 'text-[#0067C0]' : 'text-[#717783]'}
              />
              <span>{tab.label}</span>

              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-[#0067C0]/10 text-[#0067C0]'
                      : 'bg-[#E5E5E5] text-[#1B1B1B]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}

              <span
                className={`text-[10px] px-1 py-0.2 rounded font-mono border ${
                  isActive
                    ? 'bg-[#F9F9F9] text-[#0067C0] border-[#D1D1D1]'
                    : 'bg-[#EBEBEB] text-[#717783] border-[#D1D1D1]'
                }`}
              >
                [{tab.shortcut}]
              </span>
            </button>
          )
        })}
      </div>

      {suspendedSalesCount > 0 && (
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-[4px] text-amber-800 text-[11px] font-bold mr-2">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          <span>{suspendedSalesCount} ventas en espera</span>
        </div>
      )}
    </div>
  )
}

export default NavigationTabs
