import React from 'react'
import type { User } from '@shared/contracts'
import { Users, Edit3, Power, Trash2, Shield, Key } from '../../../shared/icons/Icons'

interface UserTableProps {
  users: User[]
  isLoading: boolean
  currentUserId?: string
  onEdit: (user: User) => void
  onToggleStatus: (user: User) => void
  onDelete: (user: User) => void
}

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  ADMIN: { label: 'Administrador', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  SUPERVISOR: { label: 'Supervisor', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  CASHIER: { label: 'Cajero', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  isLoading,
  currentUserId,
  onEdit,
  onToggleStatus,
  onDelete
}) => {
  if (isLoading && users.length === 0) {
    return (
      <div className="py-12 text-center text-slate-500 text-xs">
        Cargando usuarios desde SQLite...
      </div>
    )
  }

  return (
    <table className="w-full text-left text-xs border-collapse">
      <thead className="sticky top-0 z-10 bg-[#F9F9F9] border-b border-[#E5E5E5] text-slate-700 font-semibold">
        <tr>
          <th className="py-2 px-3">Usuario / Nombre</th>
          <th className="py-2 px-3">Correo</th>
          <th className="py-2 px-3 text-center">Rol</th>
          <th className="py-2 px-3 text-center">PIN Caja</th>
          <th className="py-2 px-3 text-center">Permisos</th>
          <th className="py-2 px-3 text-center">Estado</th>
          <th className="py-2 px-3 text-center">Acciones</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#E5E5E5]">
        {users.length === 0 ? (
          <tr>
            <td colSpan={7} className="py-12 text-center text-slate-400">
              <Users size={32} className="mx-auto mb-2 text-slate-300" />
              <span>No se encontraron usuarios que coincidan con la búsqueda.</span>
            </td>
          </tr>
        ) : (
          users.map((u) => {
            const badge = ROLE_BADGE[u.role] ?? ROLE_BADGE.CASHIER
            const isSelf = currentUserId === u.id

            return (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors" style={{ height: '40px' }}>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-900">{u.name}</span>
                    {isSelf && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#0067C0]/10 text-[#0067C0] border border-[#0067C0]/20">
                        SESIÓN
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">@{u.username}</div>
                </td>

                <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">{u.email}</td>

                <td className="py-2 px-3 text-center">
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border ${badge.className}`}>
                    {badge.label}
                  </span>
                </td>

                <td className="py-2 px-3 text-center">
                  {u.pin ? (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      <Key size={11} className="text-slate-400" />
                      <span>••••</span>
                    </span>
                  ) : (
                    <span className="text-slate-300 text-[10px]">Sin PIN</span>
                  )}
                </td>

                <td className="py-2 px-3 text-center">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0067C0] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                    <Shield size={11} />
                    <span>{u.permissions?.length ?? 0} activos</span>
                  </span>
                </td>

                <td className="py-2 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => onToggleStatus(u)}
                    disabled={isSelf}
                    title={isSelf ? 'No puede desactivar su propia sesión' : undefined}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full transition-colors border ${
                      isSelf
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : u.active
                          ? 'bg-emerald-50 text-[#107C41] border-emerald-200 hover:bg-emerald-100 cursor-pointer'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 cursor-pointer'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-[#107C41]' : 'bg-slate-400'}`} />
                    <span>{u.active ? 'Activo' : 'Inactivo'}</span>
                  </button>
                </td>

                <td className="py-2 px-3 text-center">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(u)}
                      className="p-1 text-slate-600 hover:text-[#0067C0] hover:bg-blue-50 rounded transition-colors cursor-pointer"
                      title="Editar usuario, rol y permisos"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleStatus(u)}
                      disabled={isSelf}
                      className={`p-1 rounded transition-colors ${
                        isSelf
                          ? 'text-slate-300 cursor-not-allowed'
                          : u.active
                            ? 'text-slate-400 hover:text-[#C42B1C] hover:bg-red-50 cursor-pointer'
                            : 'text-slate-400 hover:text-[#107C41] hover:bg-emerald-50 cursor-pointer'
                      }`}
                      title={u.active ? 'Desactivar usuario' : 'Reactivar usuario'}
                    >
                      <Power size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(u)}
                      disabled={isSelf}
                      className={`p-1 rounded transition-colors ${
                        isSelf
                          ? 'text-slate-300 cursor-not-allowed'
                          : 'text-slate-400 hover:text-[#C42B1C] hover:bg-red-50 cursor-pointer'
                      }`}
                      title={isSelf ? 'No puede eliminar su propia cuenta' : 'Eliminar (soft delete)'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })
        )}
      </tbody>
    </table>
  )
}

export default UserTable
