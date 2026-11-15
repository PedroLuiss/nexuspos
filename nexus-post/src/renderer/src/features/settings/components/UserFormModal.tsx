import React, { useState } from 'react'
import type { User, UserRole, CreateUserInput, UpdateUserInput, PermissionKey } from '@shared/contracts'
import { ADMIN_PERMISSION_KEYS, ROLE_DEFAULT_PERMISSIONS } from '@shared/contracts'
import { X, Check, User as UserIcon, Lock, Key } from '../../../shared/icons/Icons'
import UserPermissionsPicker from './UserPermissionsPicker'

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (input: CreateUserInput | UpdateUserInput) => Promise<void>
  initialUser?: User | null
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MIN_PASSWORD = 8

const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  CASHIER: 'Cajero'
}

const ROLE_HELP: Record<UserRole, string> = {
  ADMIN: 'Control total y gestión de usuarios',
  SUPERVISOR: 'Operación comercial y cancelaciones',
  CASHIER: 'Cobro rápido y corte de caja'
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialUser
}) => {
  const [name, setName] = useState(initialUser?.name ?? '')
  const [username, setUsername] = useState(initialUser?.username ?? '')
  const [email, setEmail] = useState(initialUser?.email ?? '')
  const [password, setPassword] = useState('')
  const [pin, setPin] = useState(initialUser?.pin ?? '')
  const [role, setRole] = useState<UserRole>(initialUser?.role ?? 'CASHIER')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(() => {
    if (!initialUser) return [...ROLE_DEFAULT_PERMISSIONS.CASHIER]
    if (initialUser.role === 'ADMIN') return [...ADMIN_PERMISSION_KEYS]
    return initialUser.permissions ?? [...ROLE_DEFAULT_PERMISSIONS[initialUser.role]]
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleRoleChange = (newRole: UserRole): void => {
    setRole(newRole)
    setSelectedPermissions([...ROLE_DEFAULT_PERMISSIONS[newRole]])
  }

  const togglePermission = (key: PermissionKey): void => {
    if (key === 'MANAGE_USERS') return
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    )
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setErrorMsg(null)

    const cleanName = name.trim()
    const cleanUsername = username.trim().toLowerCase()
    const cleanEmail = email.trim().toLowerCase()
    const cleanPin = pin.trim()

    if (!cleanName || !cleanUsername || !cleanEmail) {
      setErrorMsg('Nombre, usuario y correo son obligatorios.')
      return
    }
    if (!EMAIL_RE.test(cleanEmail)) {
      setErrorMsg('El correo electrónico no tiene un formato válido.')
      return
    }
    if (!initialUser && password.length < MIN_PASSWORD) {
      setErrorMsg(`La contraseña inicial debe tener al menos ${MIN_PASSWORD} caracteres.`)
      return
    }
    if (initialUser && password.length > 0 && password.length < MIN_PASSWORD) {
      setErrorMsg(`La nueva contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`)
      return
    }
    if (cleanPin && !/^\d{4}$/.test(cleanPin)) {
      setErrorMsg('El PIN de caja debe tener exactamente 4 dígitos numéricos.')
      return
    }

    const permissions =
      role === 'ADMIN' ? [...ADMIN_PERMISSION_KEYS] : selectedPermissions.filter((p) => p !== 'MANAGE_USERS')

    setIsSubmitting(true)
    try {
      if (initialUser) {
        await onSubmit({
          id: initialUser.id,
          name: cleanName,
          username: cleanUsername,
          email: cleanEmail,
          password: password.length > 0 ? password : undefined,
          pin: cleanPin,
          role,
          permissions
        })
      } else {
        await onSubmit({
          name: cleanName,
          username: cleanUsername,
          email: cleanEmail,
          password,
          pin: cleanPin || undefined,
          role,
          permissions
        })
      }
      onClose()
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar usuario.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
      <div className="w-full max-w-2xl bg-white rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-[#0067C0]/10 text-[#0067C0] flex items-center justify-center">
              <UserIcon size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#1B1B1B] tracking-tight">
                {initialUser ? 'Editar Usuario y Permisos' : 'Registrar Nuevo Usuario'}
              </h2>
              <p className="text-[11px] text-[#717783]">
                Asigna credenciales de acceso y permisos específicos por módulo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#717783] hover:text-[#C42B1C] hover:bg-[#F3F3F3] p-1 rounded transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {errorMsg && (
          <div className="px-5 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nombre de Usuario (Login) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. juan.cajero"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                {initialUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña *'}
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={initialUser ? 'Dejar en blanco para conservar' : `Mínimo ${MIN_PASSWORD} caracteres`}
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                PIN de Caja (4 dígitos)
              </label>
              <div className="relative">
                <Key size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Ej. 1234"
                  className="w-full pl-8 pr-3 py-1.5 font-mono text-center tracking-widest bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0]"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Rol Principal del Usuario
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {(['CASHIER', 'SUPERVISOR', 'ADMIN'] as UserRole[]).map((r) => {
                const isSelected = role === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleChange(r)}
                    className={`p-2.5 rounded-[6px] border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#0067C0] bg-blue-50/70 shadow-2xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs">{ROLE_LABEL[r]}</span>
                      {isSelected && <Check size={14} className="text-[#0067C0]" />}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{ROLE_HELP[r]}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <UserPermissionsPicker role={role} selected={selectedPermissions} onToggle={togglePermission} />

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-[4px] hover:bg-slate-50 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] rounded-[4px] shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Check size={14} />
              <span>{isSubmitting ? 'Guardando...' : initialUser ? 'Guardar Cambios' : 'Crear Usuario'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserFormModal
