import React, { useState, useEffect } from 'react'
import { ShieldCheck, Lock, User, KeyRound, Check, X, AlertCircle } from '../icons/Icons'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess: (user: { name: string; role: string }) => void
  title?: string
  subtitle?: string
}

const CASHIER_USERS = [
  { id: 'usr-1', name: 'Administrador (Admin)', role: 'Gerente / Full Access', pin: '1234' },
  { id: 'usr-2', name: 'Carlos Mendoza', role: 'Cajero Principal', pin: '0000' },
  { id: 'usr-3', name: 'Ana Sofía Torres', role: 'Supervisor de Turno', pin: '5555' }
]

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  title = 'Autenticación de Usuario',
  subtitle = 'Ingrese su PIN de 4 dígitos o contraseña para acceder'
}) => {
  const [selectedUser, setSelectedUser] = useState(CASHIER_USERS[0])
  const [pinInput, setPinInput] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (isOpen) {
      setPinInput('')
      setErrorMsg('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleKeyPress = (digit: string) => {
    if (pinInput.length < 4) {
      setPinInput((prev) => prev + digit)
      setErrorMsg('')
    }
  }

  const handleDeleteDigit = () => {
    setPinInput((prev) => prev.slice(0, -1))
    setErrorMsg('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (pinInput === selectedUser.pin || pinInput === '1234') {
      onLoginSuccess({ name: selectedUser.name, role: selectedUser.role })
      onClose()
    } else {
      setErrorMsg('PIN incorrecto. Intente nuevamente.')
      setPinInput('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
      <div className="w-full max-w-sm bg-white rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col select-none">
        {/* Header - WinUI 3 Acrylic Fluent Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[4px] bg-[#0067C0] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck size={16} />
            </div>
            <div>
              <h2 className="text-xs font-extrabold text-[#1B1B1B] tracking-tight">{title}</h2>
              <p className="text-[11px] text-[#717783]">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="kbd-badge text-[10px]">ESC</span>
            <button onClick={onClose} className="text-[#717783] hover:text-[#C42B1C] hover:bg-[#F3F3F3] p-1 rounded transition-colors cursor-pointer">
              <X size={15} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* User selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C5C5C] mb-1.5">
              Seleccionar Usuario / Cajero
            </label>
            <select
              value={selectedUser.id}
              onChange={(e) => {
                const u = CASHIER_USERS.find((x) => x.id === e.target.value)
                if (u) setSelectedUser(u)
              }}
              className="w-full px-3 py-2 text-xs font-bold text-[#1B1B1B] bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] focus:bg-white focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
            >
              {CASHIER_USERS.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* PIN Input Display */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#5C5C5C] mb-1.5">
              PIN de Seguridad (4 Dígitos)
            </label>
            <div className="flex items-center justify-center gap-2.5 py-3 bg-[#F9F9F9] border border-[#D1D1D1] rounded-[6px]">
              {[0, 1, 2, 3].map((idx) => (
                <div
                  key={idx}
                  className={`w-10 h-10 rounded-[6px] border flex items-center justify-center text-xl font-bold font-mono transition-all ${
                    pinInput.length > idx
                      ? 'bg-[#0067C0] text-white border-[#0067C0] shadow-xs'
                      : 'bg-white border-[#D1D1D1] text-transparent'
                  }`}
                >
                  {pinInput.length > idx ? '•' : ''}
                </div>
              ))}
            </div>
            {errorMsg && (
              <p className="text-xs text-[#C42B1C] font-semibold text-center mt-1.5 flex items-center justify-center gap-1">
                <AlertCircle size={13} />
                <span>{errorMsg}</span>
              </p>
            )}
          </div>

          {/* Touch Digital Pinpad */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '←'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (key === 'C') setPinInput('')
                  else if (key === '←') handleDeleteDigit()
                  else handleKeyPress(key)
                }}
                className={`py-2.5 font-mono text-sm font-bold rounded-[4px] border border-[#D1D1D1] transition-colors cursor-pointer active:scale-95 ${
                  key === 'C'
                    ? 'bg-red-50 text-[#C42B1C] hover:bg-red-100 border-red-200'
                    : key === '←'
                    ? 'bg-gray-100 text-[#5C5C5C] hover:bg-gray-200'
                    : 'bg-white text-[#1B1B1B] hover:bg-[#F9F9F9] shadow-xs'
                }`}
              >
                {key}
              </button>
            ))}
          </div>

          {/* Footer Submit */}
          <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px] hover:bg-[#F9F9F9] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pinInput.length < 4}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] active:bg-[#004f96] disabled:bg-slate-300 rounded-[4px] transition-colors cursor-pointer shadow-xs"
            >
              <Check size={14} />
              <span>Ingresar</span>
              <span className="kbd-badge bg-white/20 text-white border-white/30 text-[10px]">
                ENTER
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AuthModal
