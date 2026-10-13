import React, { useState } from 'react'
import { Users, Plus, Edit2, Trash2, CheckCircle2, Shield, Monitor, Key, X } from '../../../shared/icons/Icons'
import { Modal, Button, InputField } from '../../../shared/ui'

export interface SystemUser {
  id: string
  name: string
  username: string
  role: 'Administrador' | 'Cajero' | 'Supervisor' | 'Inventario'
  assignedCashRegister: string
  pin: string
  active: boolean
}

interface UserRegisterModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveFeedback: (msg: string) => void
}

const AVAILABLE_REGISTERS = [
  'Caja 01 - Principal (POS Center)',
  'Caja 02 - Expreso (Rápida)',
  'Caja 03 - Autoservicio (Kiosco)',
  'Caja 04 - Impulsos & Dulcería',
  'Todas las Cajas (Acceso Global Admin)'
]

export const UserRegisterModal: React.FC<UserRegisterModalProps> = ({
  isOpen,
  onClose,
  onSaveFeedback
}) => {
  const [users, setUsers] = useState<SystemUser[]>([
    {
      id: 'usr-1',
      name: 'Carlos Pérez',
      username: 'carlos.perez',
      role: 'Cajero',
      assignedCashRegister: 'Caja 01 - Principal (POS Center)',
      pin: '1234',
      active: true
    },
    {
      id: 'usr-2',
      name: 'María Gómez',
      username: 'maria.gomez',
      role: 'Administrador',
      assignedCashRegister: 'Todas las Cajas (Acceso Global Admin)',
      pin: '8888',
      active: true
    },
    {
      id: 'usr-3',
      name: 'Pedro Luis',
      username: 'pedro.luis',
      role: 'Supervisor',
      assignedCashRegister: 'Caja 02 - Expreso (Rápida)',
      pin: '4321',
      active: true
    }
  ])

  const [isEditing, setIsEditing] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  // Form State
  const [formName, setFormName] = useState('')
  const [formUsername, setFormUsername] = useState('')
  const [formRole, setFormRole] = useState<'Administrador' | 'Cajero' | 'Supervisor' | 'Inventario'>('Cajero')
  const [formRegister, setFormRegister] = useState(AVAILABLE_REGISTERS[0])
  const [formPin, setFormPin] = useState('')
  const [formActive, setFormActive] = useState(true)

  if (!isOpen) return null

  const handleOpenCreate = () => {
    setEditingUserId(null)
    setFormName('')
    setFormUsername('')
    setFormRole('Cajero')
    setFormRegister(AVAILABLE_REGISTERS[0])
    setFormPin('')
    setFormActive(true)
    setIsEditing(true)
  }

  const handleOpenEdit = (user: SystemUser) => {
    setEditingUserId(user.id)
    setFormName(user.name)
    setFormUsername(user.username)
    setFormRole(user.role)
    setFormRegister(user.assignedCashRegister)
    setFormPin(user.pin)
    setFormActive(user.active)
    setIsEditing(true)
  }

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim() || !formUsername.trim()) return

    if (editingUserId) {
      setUsers(
        users.map((u) =>
          u.id === editingUserId
            ? {
                ...u,
                name: formName.trim(),
                username: formUsername.trim(),
                role: formRole,
                assignedCashRegister: formRegister,
                pin: formPin || '0000',
                active: formActive
              }
            : u
        )
      )
      onSaveFeedback(`Usuario ${formName} y Caja Asignada actualizados correctamente`)
    } else {
      const newUser: SystemUser = {
        id: `usr-${Date.now()}`,
        name: formName.trim(),
        username: formUsername.trim(),
        role: formRole,
        assignedCashRegister: formRegister,
        pin: formPin || '0000',
        active: formActive
      }
      setUsers([...users, newUser])
      onSaveFeedback(`Nuevo usuario ${formName} registrado con asignación de caja`)
    }

    setIsEditing(false)
  }

  const handleToggleStatus = (userId: string) => {
    setUsers(
      users.map((u) => (u.id === userId ? { ...u, active: !u.active } : u))
    )
    onSaveFeedback('Estado de usuario modificado')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
      <div className="w-full max-w-3xl bg-white rounded-sm shadow-2xl border border-[#D1D1D1] overflow-hidden flex flex-col font-sans animate-modal">
        {/* Title Header */}
        <div className="px-5 py-3.5 bg-[#F9F9F9] border-b border-[#E5E5E5] flex items-center justify-between select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-[#0067C0]/10 text-[#0067C0] flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
                Gestión de Usuarios y Cajas Asignadas (POS WinUI)
              </h3>
              <p className="text-[11px] text-[#717783]">
                Asignación de cajas registradoras, roles y PIN de autenticación por cajero
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="kbd-badge text-[10px] text-[#717783] bg-[#EBEBEB] px-1.5 py-0.5 rounded border border-[#D1D1D1] font-mono">
              ESC
            </span>
            <button
              onClick={onClose}
              className="text-[#717783] hover:text-[#C42B1C] hover:bg-[#F3F3F3] p-1 rounded transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
          {!isEditing ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#1B1B1B]">
                  Usuarios Registrados ({users.length})
                </span>
                <Button variant="primary" onClick={handleOpenCreate} icon={<Plus size={14} />}>
                  Nuevo Usuario
                </Button>
              </div>

              {/* User Table */}
              <div className="w-full border border-[#D1D1D1] rounded-sm overflow-hidden bg-white shadow-xs">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[#F3F3F3] text-[#5C5C5C] font-semibold border-b border-[#D1D1D1]">
                    <tr className="h-9">
                      <th className="px-3">Usuario / Nombre</th>
                      <th className="px-3">Rol</th>
                      <th className="px-3">Caja Asignada</th>
                      <th className="px-3">PIN Acceso</th>
                      <th className="px-3">Estado</th>
                      <th className="px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E5E5]">
                    {users.map((u) => (
                      <tr key={u.id} className="h-10 hover:bg-[#F9F9F9] transition-colors">
                        <td className="px-3">
                          <div className="font-bold text-[#1B1B1B]">{u.name}</div>
                          <div className="text-[10px] text-[#717783] font-mono">@{u.username}</div>
                        </td>
                        <td className="px-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                              u.role === 'Administrador'
                                ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : u.role === 'Supervisor'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-blue-50 text-[#0067C0] border-blue-200'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-3 text-[#1B1B1B] font-medium">
                          <div className="flex items-center gap-1.5">
                            <Monitor size={13} className="text-[#0067C0] shrink-0" />
                            <span className="truncate max-w-[200px]">{u.assignedCashRegister}</span>
                          </div>
                        </td>
                        <td className="px-3 font-mono font-bold text-[#5C5C5C]">
                          <div className="flex items-center gap-1">
                            <Key size={12} className="text-[#717783]" />
                            <span>•••• ({u.pin})</span>
                          </div>
                        </td>
                        <td className="px-3">
                          <button
                            onClick={() => handleToggleStatus(u.id)}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                              u.active
                                ? 'bg-emerald-50 text-[#107C41] border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-red-50 text-[#C42B1C] border border-red-200 hover:bg-red-100'
                            }`}
                          >
                            {u.active ? 'Activo' : 'Inactivo'}
                          </button>
                        </td>
                        <td className="px-3 text-right">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-[#0067C0] hover:bg-[#EBF0F5] rounded transition-colors"
                            title="Editar usuario"
                          >
                            <Edit2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* User Form */
            <form onSubmit={handleSaveUser} className="space-y-3.5 bg-[#F9F9F9] p-4 rounded-sm border border-[#E5E5E5]">
              <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-2">
                <h4 className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wide">
                  {editingUserId ? 'Editar Usuario y Caja Asignada' : 'Crear Nuevo Usuario POS'}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-[#717783] hover:text-[#1B1B1B]"
                >
                  Volver a Lista
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Nombre Completo"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Juan Carlos López"
                  required
                />
                <InputField
                  label="Nombre de Usuario (Login)"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="Ej. juan.lopez"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">Rol Operativo</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full h-8 px-2.5 text-xs bg-white border border-[#D1D1D1] rounded-sm text-[#1B1B1B] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
                  >
                    <option value="Cajero">Cajero</option>
                    <option value="Supervisor">Supervisor de Turno</option>
                    <option value="Administrador">Administrador General</option>
                    <option value="Inventario">Encargado de Inventario</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">Caja Registradora Asignada</label>
                  <select
                    value={formRegister}
                    onChange={(e) => setFormRegister(e.target.value)}
                    className="w-full h-8 px-2.5 text-xs bg-white border border-[#D1D1D1] rounded-sm text-[#1B1B1B] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
                  >
                    {AVAILABLE_REGISTERS.map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="PIN de Autenticación Rápida (4 dígitos)"
                  type="password"
                  maxLength={6}
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value)}
                  placeholder="Ej. 1234"
                  required
                />

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#1B1B1B]">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="rounded text-[#0067C0] focus:ring-[#0067C0]"
                    />
                    <span className="font-semibold">Usuario Activo en Sistema</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#E5E5E5]">
                <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  {editingUserId ? 'Guardar Cambios' : 'Registrar Usuario'}
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5] flex justify-between items-center text-xs text-[#717783]">
          <span>NexusPOS CashShift System v2.4</span>
          <Button variant="secondary" onClick={onClose}>
            Cerrar Ventana
          </Button>
        </div>
      </div>
    </div>
  )
}

export default UserRegisterModal
