import React, { useEffect, useState } from 'react'
import type { User } from '@shared/contracts'
import {
  Users,
  Building2,
  Database,
  Scale,
  CheckCircle2,
  AlertCircle,
  ShieldAlert
} from '../../shared/icons/Icons'
import { canManageUsers } from '../../shared/lib/permissions'
import { useUsers } from './hooks/useUsers'
import SettingsCard from './components/SettingsCard'
import UserManagerModal from './components/UserManagerModal'
import BusinessInfoModal from './components/BusinessInfoModal'
import DatabaseBackupModal from './components/DatabaseBackupModal'
import ScaleSettingsModal from './components/ScaleSettingsModal'

type SettingsModal = 'users' | 'business' | 'database' | 'scale' | null

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

  // Identidad comercial y plantilla de ticket
  const [business, setBusiness] = useState({
    companyName: 'NEXUS MARKET S.A. DE C.V.',
    taxId: 'NEX-980412-A10',
    phone: '(55) 5555-0199',
    header: '¡Bienvenidos a Nexus Market!',
    footer: 'Conserve este ticket para cualquier cambio o devolución.'
  })

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
    clearError()
    setActiveModal(modal)
  }

  // Atajo [ALT+U] del módulo (solo Administrador)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.altKey && e.key.toLowerCase() === 'u') {
        e.preventDefault()
        openModal('users')
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
            Gestión de usuarios y permisos (RBAC), identidad fiscal, base de datos SQLite y puertos de hardware
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
              ? { label: 'Administrador', className: 'bg-[#0067C0]/10 text-[#0067C0] border-[#0067C0]/20' }
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
          title="Datos de Negocio y Ticket"
          subtitle="Datos fiscales y plantilla de recibo"
          accent="green"
          badge={{ label: 'Verificado', className: 'bg-emerald-50 text-[#107C41] border-emerald-200' }}
          description="Personalice el encabezado del ticket térmico de 80mm, RFC/RUT, teléfono de atención y mensajes de pie de página."
          facts={[
            { label: 'Razón Social:', value: business.companyName, valueClassName: 'font-mono max-w-[200px]' },
            { label: 'Registro Fiscal (RFC):', value: business.taxId, valueClassName: 'font-mono' },
            { label: 'Formato Ticket:', value: 'ESC/POS Térmico 80mm' }
          ]}
          footerNote="Impresión activa"
          actionLabel="Editar Datos Ticket"
          onAction={() => openModal('business')}
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
            { label: 'Usuarios auditados:', value: `${users.length} registros` }
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
          badge={{ label: `${scale.comPort} Configurado`, className: 'bg-amber-50 text-amber-700 border-amber-200' }}
          description="Conexión para balanzas de peso comercial (Torrey, Rhino, Dibal) mediante puerto serial. Transmite el peso al POS."
          facts={[
            { label: 'Puerto Activo:', value: `${scale.comPort} (RS-232)`, valueClassName: 'font-mono' },
            { label: 'Baud Rate:', value: `${scale.baudRate} bps`, valueClassName: 'font-mono' },
            { label: 'Estado de Enlace:', value: 'Listo para pesaje', valueClassName: 'text-[#107C41]' }
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

      <BusinessInfoModal
        isOpen={activeModal === 'business'}
        onClose={() => setActiveModal(null)}
        initialData={business}
        onSave={(data) => {
          setBusiness(data)
          showFeedback('Plantilla de ticket y datos fiscales actualizados')
        }}
      />

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
            Sesión sin privilegios de Administrador: la gestión de usuarios, roles y permisos está
            bloqueada.
          </span>
        </div>
      )}
    </div>
  )
}

export default SettingsGrid
