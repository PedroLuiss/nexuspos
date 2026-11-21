import React from 'react'
import type { UserRole } from '@shared/contracts'
import { Check } from '../../../shared/icons/Icons'

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

interface UserRoleSelectorProps {
  role: UserRole
  onChange: (role: UserRole) => void
}

export function UserRoleSelector({ role, onChange }: UserRoleSelectorProps): React.JSX.Element {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-slate-700">
        Rol Principal del Usuario
      </label>
      <div className="grid grid-cols-3 gap-2.5">
        {(['CASHIER', 'SUPERVISOR', 'ADMIN'] as UserRole[]).map((nextRole) => {
          const isSelected = role === nextRole
          return (
            <button
              key={nextRole}
              type="button"
              onClick={() => onChange(nextRole)}
              className={`cursor-pointer rounded-[6px] border p-2.5 text-left transition-all ${
                isSelected
                  ? 'border-[#0067C0] bg-blue-50/70 shadow-2xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{ROLE_LABEL[nextRole]}</span>
                {isSelected && <Check size={14} className="text-[#0067C0]" />}
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500">{ROLE_HELP[nextRole]}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
