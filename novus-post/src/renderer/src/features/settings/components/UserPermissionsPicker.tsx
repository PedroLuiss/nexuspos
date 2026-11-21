import React from 'react'
import type { PermissionKey, UserRole } from '@shared/contracts'
import { ALL_ACTION_PERMISSIONS, ALL_MODULE_PERMISSIONS } from '@shared/contracts'
import { Shield } from '../../../shared/icons/Icons'

interface UserPermissionsPickerProps {
  role: UserRole
  selected: string[]
  onToggle: (key: PermissionKey) => void
}

const checkboxClass =
  'mt-0.5 rounded border-slate-300 text-[#0067C0] focus:ring-[#0067C0] disabled:opacity-50'

export const UserPermissionsPicker: React.FC<UserPermissionsPickerProps> = ({
  role,
  selected,
  onToggle
}) => {
  const moduleCount = ALL_MODULE_PERMISSIONS.filter((m) => selected.includes(m.key)).length
  const isAdmin = role === 'ADMIN'

  return (
    <div className="space-y-3 pt-2 border-t border-slate-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <Shield size={14} className="text-[#0067C0]" />
          <span>Permisos de Módulos (Acceso a Pantallas)</span>
        </span>
        <span className="text-[11px] text-[#0067C0] font-mono">
          {isAdmin ? ALL_MODULE_PERMISSIONS.length : moduleCount}/{ALL_MODULE_PERMISSIONS.length}{' '}
          módulos habilitados
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 bg-[#F9F9F9] p-3 rounded-[6px] border border-slate-200">
        {ALL_MODULE_PERMISSIONS.map((mod) => (
          <label
            key={mod.key}
            className="flex items-start gap-2 p-1.5 rounded hover:bg-white transition-colors cursor-pointer"
          >
            <input
              type="checkbox"
              checked={isAdmin || selected.includes(mod.key)}
              disabled={isAdmin}
              onChange={() => onToggle(mod.key)}
              className={checkboxClass}
            />
            <div>
              <span className="block font-semibold text-slate-800 text-[11px]">{mod.label}</span>
              <span className="block text-[10px] text-slate-500">{mod.description}</span>
            </div>
          </label>
        ))}
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-900">Acciones Críticas Autorizadas</span>
        <div className="grid grid-cols-2 gap-2 bg-[#F9F9F9] p-3 rounded-[6px] border border-slate-200">
          {ALL_ACTION_PERMISSIONS.map((act) => {
            const isManageUsers = act.key === 'MANAGE_USERS'
            return (
              <label
                key={act.key}
                className="flex items-start gap-2 p-1.5 rounded hover:bg-white transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isManageUsers ? isAdmin : selected.includes(act.key)}
                  disabled={isManageUsers}
                  onChange={() => onToggle(act.key)}
                  className={checkboxClass}
                />
                <div>
                  <span className="block font-semibold text-slate-800 text-[11px]">{act.label}</span>
                  <span className="block text-[10px] text-slate-500">{act.description}</span>
                </div>
              </label>
            )
          })}
        </div>
        <p className="text-[10px] text-slate-500 leading-relaxed">
          La gestión de usuarios es exclusiva del rol <strong>Administrador</strong>. Los permisos de
          módulo ocultan las pestañas no autorizadas al iniciar sesión.
        </p>
      </div>
    </div>
  )
}

export default UserPermissionsPicker
