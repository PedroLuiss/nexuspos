import React, { useMemo, useState } from 'react'
import type { User, CreateUserInput, UpdateUserInput } from '@shared/contracts'
import {
  Users,
  Plus,
  Search,
  X,
  ShieldAlert,
  RefreshCw
} from '../../../shared/icons/Icons'
import UserTable from './UserTable'
import UserFormModal from './UserFormModal'

interface UserManagerModalProps {
  isOpen: boolean
  onClose: () => void
  users: User[]
  isLoading: boolean
  error: string | null
  currentUserId?: string
  canManage: boolean
  onCreateUser: (input: CreateUserInput) => Promise<User>
  onUpdateUser: (input: UpdateUserInput) => Promise<User>
  onToggleStatus: (id: string) => Promise<User>
  onDeleteUser: (id: string) => Promise<void>
  onReload: () => Promise<void>
}

type RoleFilter = 'ALL' | 'ADMIN' | 'SUPERVISOR' | 'CASHIER'

export const UserManagerModal: React.FC<UserManagerModalProps> = ({
  isOpen,
  onClose,
  users,
  isLoading,
  error,
  currentUserId,
  canManage,
  onCreateUser,
  onUpdateUser,
  onToggleStatus,
  onDeleteUser,
  onReload
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return users.filter((u) => {
      const matchesSearch =
        term.length === 0 ||
        u.name.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, searchTerm, roleFilter])

  if (!isOpen) return null

  if (!canManage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
        <div className="w-full max-w-md bg-white rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] overflow-hidden animate-modal">
          <div className="px-5 py-3 bg-red-50 border-b border-red-200 flex items-center gap-2 text-[#C42B1C]">
            <ShieldAlert size={16} />
            <h2 className="text-xs font-extrabold uppercase tracking-wide">Acceso restringido</h2>
          </div>
          <p className="p-5 text-xs text-[#5C5C5C] leading-relaxed">
            La gestión de usuarios, roles y permisos es exclusiva del rol{' '}
            <strong className="text-[#1B1B1B]">Administrador</strong>. Inicie sesión con una cuenta
            administrativa para continuar.
          </p>
          <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-[4px] hover:bg-slate-50 cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    )
  }

  const openCreate = (): void => {
    setActionError(null)
    setEditingUser(null)
    setIsFormOpen(true)
  }

  const openEdit = (user: User): void => {
    setActionError(null)
    setEditingUser(user)
    setIsFormOpen(true)
  }

  const handleFormSubmit = async (input: CreateUserInput | UpdateUserInput): Promise<void> => {
    if ('id' in input) {
      await onUpdateUser(input)
    } else {
      await onCreateUser(input)
    }
  }

  const handleToggle = async (user: User): Promise<void> => {
    setActionError(null)
    try {
      await onToggleStatus(user.id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo cambiar el estado del usuario.')
    }
  }

  const handleConfirmDelete = async (): Promise<void> => {
    if (!userToDelete) return
    setActionError(null)
    try {
      await onDeleteUser(userToDelete.id)
      setUserToDelete(null)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo eliminar el usuario.')
    }
  }

  const activeCount = users.filter((u) => u.active).length
  const adminCount = users.filter((u) => u.role === 'ADMIN' && u.active).length
  const displayError = actionError ?? error

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
      <div className="w-full max-w-4xl bg-white rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-[#0067C0]/10 text-[#0067C0] flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#1B1B1B] tracking-tight">
                Gestión de Usuarios, Roles y Permisos
              </h2>
              <p className="text-[11px] text-[#717783]">
                {users.length} usuarios · {activeCount} activos · {adminCount} administradores · SQLite
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

        <div className="p-3 bg-white border-b border-[#E5E5E5] flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, usuario o correo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0]"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] text-slate-700 font-medium"
            >
              <option value="ALL">Todos los Roles</option>
              <option value="ADMIN">Administradores</option>
              <option value="SUPERVISOR">Supervisores</option>
              <option value="CASHIER">Cajeros</option>
            </select>

            <button
              type="button"
              onClick={() => void onReload()}
              className="p-1.5 text-slate-600 hover:text-[#0067C0] hover:bg-blue-50 border border-slate-300 rounded-[4px] cursor-pointer"
              title="Recargar desde SQLite"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] rounded-[4px] shadow-xs cursor-pointer transition-colors"
          >
            <Plus size={14} />
            <span>Nuevo Usuario</span>
          </button>
        </div>

        {displayError && (
          <div className="px-5 py-2 bg-red-50 border-b border-red-200 text-red-700 text-xs font-semibold">
            {displayError}
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <UserTable
            users={filteredUsers}
            isLoading={isLoading}
            currentUserId={currentUserId}
            onEdit={openEdit}
            onToggleStatus={(u) => void handleToggle(u)}
            onDelete={setUserToDelete}
          />
        </div>

        <div className="flex items-center justify-between px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            {filteredUsers.length} de {users.length} usuarios registrados en SQLite
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-[4px] hover:bg-slate-50 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      {userToDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-sm bg-white rounded-[8px] shadow-xl border border-[#D1D1D1] overflow-hidden">
            <div className="px-4 py-3 bg-red-50 border-b border-red-200">
              <h3 className="text-xs font-bold text-[#C42B1C] uppercase tracking-wide">
                Eliminar usuario (soft delete)
              </h3>
            </div>
            <p className="p-4 text-xs text-slate-600 leading-relaxed">
              El usuario <strong className="text-slate-900">{userToDelete.name}</strong>{' '}
              <span className="font-mono">(@{userToDelete.username})</span> quedará inactivo y
              conservará su historial de ventas, Kardex y auditoría. ¿Desea continuar?
            </p>
            <div className="px-4 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-end gap-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-[4px] hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => void handleConfirmDelete()}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#C42B1C] hover:bg-red-700 rounded-[4px] cursor-pointer"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {isFormOpen && (
        <UserFormModal
          key={editingUser?.id ?? 'new-user'}
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSubmit={handleFormSubmit}
          initialUser={editingUser}
        />
      )}
    </div>
  )
}

export default UserManagerModal
