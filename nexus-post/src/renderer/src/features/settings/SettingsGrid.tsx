import React, { useEffect, useState } from 'react'
import type { User } from '@shared/contracts'
import { AlertCircle, CheckCircle2, ShieldAlert } from '../../shared/icons/Icons'
import { canManageUsers } from '../../shared/lib/permissions'
import { useBusinessConfig } from '../../shared/hooks/useBusinessConfig'
import { useUsers } from './hooks/useUsers'
import UserManagerModal from './components/UserManagerModal'
import BusinessInfoModal from './components/BusinessInfoModal'
import TaxSettingsModal from './components/TaxSettingsModal'
import ProductCatalogsSettingsModal from './components/ProductCatalogsSettingsModal'
import DatabaseBackupModal from './components/DatabaseBackupModal'
import ScaleSettingsModal from './components/ScaleSettingsModal'
import {
  SettingsCards,
  type ScaleConfigView,
  type SettingsModalAction
} from './components/SettingsCards'

interface SettingsGridProps {
  currentUser?: User | null
}

interface Feedback {
  message: string
  type: 'success' | 'error'
}

export const SettingsGrid: React.FC<SettingsGridProps> = ({ currentUser }) => {
  const isAdmin = canManageUsers(currentUser ?? null)
  const [activeModal, setActiveModal] = useState<SettingsModalAction | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)
  const [scaleConfig, setScaleConfig] = useState<ScaleConfigView>({
    comPort: 'COM3',
    baudRate: 9600,
    isEnabled: false,
    isConnected: false
  })

  const {
    users,
    isLoading,
    error,
    reload,
    createUser,
    updateUser,
    deleteUser,
    toggleStatus,
    clearError
  } = useUsers(isAdmin)

  const { config: business, saveConfig, isLoading: isConfigLoading } = useBusinessConfig()

  const showFeedback = (message: string, type: Feedback['type'] = 'success'): void => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback(null), 3500)
  }

  const openModal = (modal: SettingsModalAction): void => {
    if (modal === 'users' && !isAdmin) {
      showFeedback('Acceso denegado: solo el Administrador gestiona usuarios y permisos.', 'error')
      return
    }
    if ((modal === 'business' || modal === 'tax') && !isAdmin) {
      showFeedback(
        'Acceso denegado: solo el Administrador modifica los datos fiscales y los impuestos.',
        'error'
      )
      return
    }
    if (modal === 'catalogs' && !isAdmin) {
      showFeedback(
        'Acceso denegado: solo el Administrador puede gestionar los catálogos de producto.',
        'error'
      )
      return
    }
    if (modal === 'database' && !isAdmin) {
      showFeedback(
        'Acceso denegado: solo el Administrador puede administrar la base de datos.',
        'error'
      )
      return
    }
    if (modal === 'scale' && !isAdmin) {
      showFeedback('Acceso denegado: solo el Administrador configura la báscula serial.', 'error')
      return
    }
    clearError()
    setActiveModal(modal)
  }

  // Cargar configuración de báscula al montar
  useEffect(() => {
    const loadScaleConfig = async (): Promise<void> => {
      try {
        const config = await window.api.hardware.getScaleConfig()
        const status = await window.api.hardware.isConnected()
        if (config) {
          setScaleConfig({
            comPort: config.comPort,
            baudRate: config.baudRate,
            isEnabled: config.isEnabled,
            isConnected: status.isConnected
          })
        }
      } catch {
        // Ignorar errores al cargar configuración de escala
      }
    }
    loadScaleConfig()
  }, [])

  // Atajos del módulo: [ALT+U] usuarios, [ALT+A] datos de negocio, [ALT+T] IVA, [ALT+O] catálogos
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (!e.altKey) return
      const key = e.key.toLowerCase()
      if (key === 'u') {
        e.preventDefault()
        openModal('users')
      } else if (key === 'a') {
        e.preventDefault()
        openModal('business')
      } else if (key === 't') {
        e.preventDefault()
        openModal('tax')
      } else if (key === 'o') {
        e.preventDefault()
        openModal('catalogs')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const activeAdmins = users.filter((u) => u.role === 'ADMIN' && u.active).length
  const activeUsers = users.filter((u) => u.active).length

  return (
    <div className="flex flex-col h-full p-3 space-y-2.5 overflow-y-auto bg-[#F3F3F3]">
      <div className="p-3 bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
            Ajustes Generales del Sistema NexusPOS
          </h2>
          <p className="text-xs text-[#5C5C5C] mt-0.5">
            Datos del negocio y ticket, impuestos (IVA), usuarios y permisos (RBAC), respaldos y
            puertos de hardware
          </p>
        </div>

        {feedback && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-xs font-semibold border ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-[#107C41]'
                : 'bg-red-50 border-red-200 text-[#C42B1C]'
            }`}
          >
            {feedback.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            <span>{feedback.message}</span>
          </div>
        )}
      </div>

      <SettingsCards
        isAdmin={isAdmin}
        userCount={users.length}
        activeUsers={activeUsers}
        activeAdmins={activeAdmins}
        business={business}
        isConfigLoading={isConfigLoading}
        scaleConfig={scaleConfig}
        onOpenModal={openModal}
      />

      <UserManagerModal
        isOpen={activeModal === 'users'}
        onClose={() => setActiveModal(null)}
        users={users}
        isLoading={isLoading}
        error={error}
        currentUserId={currentUser?.id}
        canManage={isAdmin}
        onCreateUser={createUser}
        onUpdateUser={updateUser}
        onToggleStatus={toggleStatus}
        onDeleteUser={deleteUser}
        onReload={reload}
      />

      {activeModal === 'business' && (
        <BusinessInfoModal
          isOpen
          onClose={() => setActiveModal(null)}
          config={business}
          canEdit={isAdmin}
          onSave={async (input) => {
            await saveConfig(input)
            showFeedback('Datos del negocio y plantilla de ticket guardados correctamente')
          }}
        />
      )}

      {activeModal === 'tax' && (
        <TaxSettingsModal
          isOpen
          onClose={() => setActiveModal(null)}
          config={business}
          canEdit={isAdmin}
          onSave={async (input) => {
            await saveConfig(input)
            showFeedback(
              input.taxEnabled
                ? 'Catálogo de impuestos y reglas fiscales guardados y aplicados en el POS'
                : 'Impuestos desactivados: el POS ya no calcula alícuotas'
            )
          }}
        />
      )}

      {activeModal === 'catalogs' && (
        <ProductCatalogsSettingsModal
          isOpen
          onClose={() => setActiveModal(null)}
          canEdit={isAdmin}
        />
      )}

      <DatabaseBackupModal
        isOpen={activeModal === 'database'}
        onClose={() => setActiveModal(null)}
        onFeedback={(msg, type) => showFeedback(msg, type)}
      />

      <ScaleSettingsModal
        isOpen={activeModal === 'scale'}
        onClose={() => setActiveModal(null)}
        onFeedback={(msg) => showFeedback(msg)}
      />

      {!isAdmin && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-[4px] text-[11px] text-slate-600">
          <ShieldAlert size={14} className="text-slate-500" />
          <span>
            Sesión sin privilegios de Administrador: la gestión de usuarios, los datos fiscales del
            negocio, la tasa de impuesto y el mantenimiento de base de datos están restringidos a
            ADMIN.
          </span>
        </div>
      )}
    </div>
  )
}

export default SettingsGrid
