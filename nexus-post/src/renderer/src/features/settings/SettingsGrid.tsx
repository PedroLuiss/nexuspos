import React, { useEffect, useState } from 'react'
import type { User } from '@shared/contracts'
import {
  Users,
  Building2,
  Database,
  Scale,
  Percent,
  CheckCircle2,
  AlertCircle,
  ShieldAlert
} from '../../shared/icons/Icons'
import { canManageUsers } from '../../shared/lib/permissions'
import { getCurrencySymbol } from '../../shared/lib/businessConfig'
import { useBusinessConfig } from '../../shared/hooks/useBusinessConfig'
import { useUsers } from './hooks/useUsers'
import SettingsCard from './components/SettingsCard'
import UserManagerModal from './components/UserManagerModal'
import BusinessInfoModal from './components/BusinessInfoModal'
import TaxSettingsModal from './components/TaxSettingsModal'
import DatabaseBackupModal from './components/DatabaseBackupModal'
import ScaleSettingsModal from './components/ScaleSettingsModal'

type SettingsModal = 'users' | 'business' | 'tax' | 'database' | 'scale' | null

interface SettingsGridProps {
  currentUser?: User | null
}

interface Feedback {
  message: string
  type: 'success' | 'error'
}

export const SettingsGrid: React.FC<SettingsGridProps> = ({ currentUser }) => {
  const isAdmin = canManageUsers(currentUser ?? null)
  const [activeModal, setActiveModal] = useState<SettingsModal>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

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

  // Báscula serial RS-232
  const [scale, setScale] = useState({ comPort: 'COM3', baudRate: 9600 })

  const showFeedback = (message: string, type: Feedback['type'] = 'success'): void => {
    setFeedback({ message, type })
    setTimeout(() => setFeedback(null), 3500)
  }

  const openModal = (modal: Exclude<SettingsModal, null>): void => {
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
    clearError()
    setActiveModal(modal)
  }

  // Atajos del módulo: [ALT+U] usuarios, [ALT+A] datos de negocio, [ALT+T] IVA
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
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  const activeAdmins = users.filter((u) => u.role === 'ADMIN' && u.active).length
  const activeUsers = users.filter((u) => u.active).length
  const currencySymbol = getCurrencySymbol(business.currency)
  const fiscalId =
    business.taxIdType === 'NONE'
      ? 'Sin identificación fiscal'
      : `${business.taxIdType}: ${business.taxId || '—'}`

  return (
    <div className="flex flex-col h-full p-3 space-y-2.5 overflow-y-auto bg-[#F3F3F3]">
      <div className="p-3 bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
            Ajustes Generales del Sistema NexusPOS
          </h2>
          <p className="text-xs text-[#5C5C5C] mt-0.5">
            Datos del negocio y ticket, impuestos (IVA), usuarios y permisos (RBAC), base de datos
            SQLite y puertos de hardware
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 flex-1">
        <SettingsCard
          icon={<Users size={22} />}
          title="Usuarios, Roles y Permisos"
          subtitle="Control granular de acceso por módulo"
          accent="blue"
          badge={
            isAdmin
              ? {
                  label: 'Administrador',
                  className: 'bg-[#0067C0]/10 text-[#0067C0] border-[#0067C0]/20'
                }
              : { label: 'Solo Admin', className: 'bg-slate-100 text-slate-500 border-slate-200' }
          }
          description="Registre cajeros y supervisores, asigne su rol comercial y habilite los módulos y acciones críticas que podrá usar durante el turno."
          facts={[
            {
              label: 'Usuarios registrados:',
              value: isAdmin ? `${users.length} (${activeUsers} activos)` : 'Requiere sesión ADMIN'
            },
            {
              label: 'Administradores activos:',
              value: isAdmin ? activeAdmins : '—'
            },
            {
              label: 'Acceso al submódulo:',
              value: isAdmin ? 'Habilitado' : 'Solo Administrador',
              valueClassName: isAdmin ? 'text-[#107C41] font-mono' : 'text-[#C42B1C] font-mono'
            }
          ]}
          footerNote={isAdmin ? 'RBAC persistido en SQLite' : 'Requiere sesión ADMIN'}
          actionLabel="Gestionar Usuarios"
          actionHotkey="ALT+U"
          onAction={() => openModal('users')}
          disabled={!isAdmin}
          disabledHint={isAdmin ? undefined : 'Solo Administrador'}
        />

        <SettingsCard
          icon={<Building2 size={22} />}
          title="Datos del Negocio y Ticket"
          subtitle="Identidad fiscal, propietario y comprobante"
          accent="green"
          badge={{
            label: isConfigLoading ? 'Cargando…' : business.taxIdType,
            className: 'bg-emerald-50 text-[#107C41] border-emerald-200'
          }}
          description="Razón social, identificación fiscal, propietario, contacto, domicilio, moneda y plantilla del ticket térmico de 80mm."
          facts={[
            {
              label: 'Razón Social:',
              value: business.legalName || '—',
              valueClassName: 'font-mono max-w-[200px]'
            },
            { label: 'Propietario:', value: business.ownerName || '—' },
            { label: 'ID Fiscal:', value: fiscalId, valueClassName: 'font-mono' },
            {
              label: 'Moneda:',
              value: `${business.currency} (${currencySymbol})`,
              valueClassName: 'font-mono'
            }
          ]}
          footerNote={isAdmin ? 'Guardado en SQLite' : 'Solo lectura'}
          actionLabel="Editar Datos"
          actionHotkey="ALT+A"
          onAction={() => openModal('business')}
          disabled={!isAdmin}
          disabledHint={isAdmin ? undefined : 'Solo Administrador'}
        />

        <SettingsCard
          icon={<Percent size={22} />}
          title="Impuestos y Facturación (IVA)"
          subtitle="Tasa trasladada en ventas y ticket"
          accent="amber"
          badge={
            business.taxEnabled
              ? {
                  label: `${business.taxName} ${business.taxRate}%`,
                  className: 'bg-amber-50 text-amber-700 border-amber-200'
                }
              : { label: 'Desactivado', className: 'bg-slate-100 text-slate-500 border-slate-200' }
          }
          description="Defina el nombre local del impuesto (IVA, IGV, ITBMS), su tasa y si los precios de venta ya lo incluyen. El POS y el ticket usan esta configuración."
          facts={[
            {
              label: 'Estado del impuesto:',
              value: business.taxEnabled ? 'Activo' : 'Desactivado',
              valueClassName: business.taxEnabled ? 'text-[#107C41]' : 'text-slate-500'
            },
            {
              label: 'Tasa aplicada:',
              value: business.taxEnabled ? `${business.taxName} ${business.taxRate}%` : '—',
              valueClassName: 'font-mono'
            },
            {
              label: 'Tratamiento del precio:',
              value: business.pricesIncludeTax ? 'Impuesto incluido' : 'Se suma al subtotal',
              valueClassName: 'font-mono'
            }
          ]}
          footerNote={isAdmin ? 'Configuración tributaria' : 'Solo lectura'}
          actionLabel="Configurar IVA"
          actionHotkey="ALT+T"
          onAction={() => openModal('tax')}
          disabled={!isAdmin}
          disabledHint={isAdmin ? undefined : 'Solo Administrador'}
        />

        <SettingsCard
          icon={<Database size={22} />}
          title="Base de Datos SQLite Local"
          subtitle="Copias de seguridad y restauración"
          accent="purple"
          badge={{ label: 'SQLite 3.4', className: 'bg-purple-50 text-purple-700 border-purple-200' }}
          description="Genere copias de seguridad locales en archivos .sqlite y restaure el sistema ante cualquier contingencia."
          facts={[
            { label: 'Motor Local:', value: 'better-sqlite3' },
            { label: 'Integridad:', value: 'OK (Sin corrupción)', valueClassName: 'text-[#107C41]' },
            { label: 'Registros de ajustes:', value: '1 configuración activa' }
          ]}
          footerNote="Offline-first"
          actionLabel="Backup / Restore"
          onAction={() => openModal('database')}
        />

        <SettingsCard
          icon={<Scale size={22} />}
          title="Báscula y Puerto Serial (RS-232)"
          subtitle="Comunicación COM por hardware"
          accent="amber"
          badge={{
            label: `${scale.comPort} Configurado`,
            className: 'bg-amber-50 text-amber-700 border-amber-200'
          }}
          description="Conexión para balanzas de peso comercial (Torrey, Rhino, Dibal) mediante puerto serial. Transmite el peso al POS."
          facts={[
            {
              label: 'Puerto Activo:',
              value: `${scale.comPort} (RS-232)`,
              valueClassName: 'font-mono'
            },
            {
              label: 'Baud Rate:',
              value: `${scale.baudRate} bps`,
              valueClassName: 'font-mono'
            },
            {
              label: 'Estado de Enlace:',
              value: 'Listo para pesaje',
              valueClassName: 'text-[#107C41]'
            }
          ]}
          footerNote="Node serialport"
          actionLabel="Configurar Puerto Serial"
          onAction={() => openModal('scale')}
        />
      </div>

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
            showFeedback('Datos del negocio y plantilla de ticket guardados en SQLite')
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
              `Impuesto ${input.taxName} ${input.taxRate}% guardado y aplicado en el POS`
            )
          }}
        />
      )}

      <DatabaseBackupModal
        isOpen={activeModal === 'database'}
        onClose={() => setActiveModal(null)}
        onFeedback={(msg) => showFeedback(msg)}
      />

      <ScaleSettingsModal
        isOpen={activeModal === 'scale'}
        onClose={() => setActiveModal(null)}
        initialPort={scale.comPort}
        initialBaudRate={scale.baudRate}
        onSave={(comPort, baudRate) => setScale({ comPort, baudRate })}
        onFeedback={(msg) => showFeedback(msg)}
      />

      {!isAdmin && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-[4px] text-[11px] text-slate-600">
          <ShieldAlert size={14} className="text-slate-500" />
          <span>
            Sesión sin privilegios de Administrador: la gestión de usuarios, los datos fiscales del
            negocio y la tasa de impuesto están en modo lectura.
          </span>
        </div>
      )}
    </div>
  )
}

export default SettingsGrid
