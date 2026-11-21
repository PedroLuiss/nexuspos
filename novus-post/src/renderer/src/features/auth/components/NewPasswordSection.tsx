import React, { useState } from 'react'
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  CloudLightning
} from '../../../shared/icons/Icons'

interface NewPasswordSectionProps {
  onCancel: () => void
  onSubmit: (newPassword: string, logoutOthers: boolean) => void
}

export const NewPasswordSection: React.FC<NewPasswordSectionProps> = ({
  onCancel,
  onSubmit
}) => {
  const [newPassword, setNewPassword] = useState('Novus@Lima2026#')
  const [confirmPassword, setConfirmPassword] = useState('Novus@Lima2026#')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [logoutOtherSessions, setLogoutOtherSessions] = useState(true)

  const hasMinLength = newPassword.length >= 8
  const hasUpperCase = /[A-Z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    onSubmit(newPassword, logoutOtherSessions)
  }

  return (
    <div className="flex flex-col justify-between space-y-4 bg-[#F8F9FA]/60 p-4 sm:p-5 rounded-xl border border-[#E9ECEF]">
      <div className="space-y-3.5">
        <div>
          <span className="font-mono text-[10px] text-[#717783] uppercase tracking-wider font-semibold">
            Paso 2 de 2
          </span>
          <h2 className="text-base font-bold text-[#1B1B1B]">Definir Nueva Clave Corporativa</h2>
          <p className="text-xs text-[#5C5C5C]">
            Establezca una contraseña segura que cumpla con los estándares de PCI-DSS para terminales POS.
          </p>
        </div>

        {/* Field: New Password */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label htmlFor="inputNewPass" className="text-xs font-semibold text-[#1B1B1B] flex items-center gap-1.5">
              <Lock size={14} className="text-[#0067C0]" />
              <span>Nueva Contraseña</span>
            </label>
            <span className="font-mono text-[10px] text-[#107C41] font-bold">
              NIVEL: EXCELENTE
            </span>
          </div>
          <div className="relative flex items-center">
            <input
              id="inputNewPass"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-10 px-3 pr-10 bg-white rounded-lg font-mono text-xs text-[#1B1B1B] shadow-2xs border border-[#D1D5DB] focus:border-transparent focus:shadow-[0_0_0_2px_#0067C0] outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-2.5 h-6 w-6 flex items-center justify-center text-[#717783] hover:text-[#1B1B1B]"
            >
              {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {/* 4-Bar Strength Meter (WinUI 3) */}
          <div className="pt-1 space-y-1">
            <div className="grid grid-cols-4 gap-1.5 h-1.5">
              <div className="bg-[#107C41] rounded-full" />
              <div className="bg-[#107C41] rounded-full" />
              <div className="bg-[#107C41] rounded-full" />
              <div className="bg-[#107C41] rounded-full" />
            </div>
            <div className="flex items-center justify-between font-mono text-[10px] text-[#717783]">
              <span>Robustez calculada</span>
              <span className="text-[#107C41] font-bold">100% - Fuerte y Segura</span>
            </div>
          </div>

          {/* Policy Chips */}
          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${hasMinLength ? 'bg-[#E8F5E9] text-[#107C41] font-semibold' : 'bg-[#E8E8E8] text-[#717783]'}`}>
              <Check size={13} />
              <span>Mínimo 8 caracteres</span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${hasUpperCase ? 'bg-[#E8F5E9] text-[#107C41] font-semibold' : 'bg-[#E8E8E8] text-[#717783]'}`}>
              <Check size={13} />
              <span>Al menos una mayúscula</span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${hasNumber ? 'bg-[#E8F5E9] text-[#107C41] font-semibold' : 'bg-[#E8E8E8] text-[#717783]'}`}>
              <Check size={13} />
              <span>Al menos un número</span>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${hasSpecialChar ? 'bg-[#E8F5E9] text-[#107C41] font-semibold' : 'bg-[#E8E8E8] text-[#717783]'}`}>
              <Check size={13} />
              <span>Carácter especial (@, #, $)</span>
            </div>
          </div>
        </div>

        {/* Field: Confirm Password */}
        <div className="space-y-1 pt-1">
          <label htmlFor="inputConfirmPass" className="text-xs font-semibold text-[#1B1B1B]">
            Confirmar Nueva Contraseña
          </label>
          <div className="relative flex items-center">
            <input
              id="inputConfirmPass"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-10 px-3 pr-10 bg-white rounded-lg font-mono text-xs text-[#1B1B1B] shadow-2xs border border-[#D1D5DB] focus:border-transparent focus:shadow-[0_0_0_2px_#0067C0] outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2.5 h-6 w-6 flex items-center justify-center text-[#717783] hover:text-[#1B1B1B]"
            >
              {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {isMatch && (
            <div className="flex items-center gap-1 text-[11px] text-[#107C41] font-semibold pt-0.5">
              <CheckCircle2 size={13} />
              <span>Las contraseñas coinciden de forma idéntica</span>
            </div>
          )}
        </div>

        {/* Checkbox: Logout other sessions */}
        <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-[#E5E5E5] cursor-pointer select-none">
          <input
            type="checkbox"
            checked={logoutOtherSessions}
            onChange={(e) => setLogoutOtherSessions(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-[#0067C0] accent-[#0067C0] cursor-pointer"
          />
          <div className="flex flex-col text-xs">
            <span className="font-semibold text-[#1B1B1B]">
              Cerrar sesiones activas en todos los demás terminales
            </span>
            <span className="text-[11px] text-[#717783]">
              Desconectará POS-01, POS-02 y la App Móvil de Almacén inmediatamente
            </span>
          </div>
        </label>
      </div>

      {/* Command Bar Actions */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#E8E8E8] hover:bg-[#D1D5DB] text-[#1B1B1B] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <span className="font-mono text-[10px] text-[#5C5C5C] px-1 bg-white rounded">ESC</span>
          <span>Cancelar Operación</span>
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full sm:w-auto px-5 py-2 rounded-lg bg-[#0067C0] hover:bg-[#0078D4] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <CloudLightning size={15} />
          <span>Actualizar Contraseña e Iniciar Sesión</span>
          <span className="font-mono text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold">
            ENTER
          </span>
        </button>
      </div>
    </div>
  )
}

export default NewPasswordSection
