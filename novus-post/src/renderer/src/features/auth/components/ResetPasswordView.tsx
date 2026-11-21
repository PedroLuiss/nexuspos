import React, { useState } from 'react'
import {
  Lock,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  AlertCircle,
  CloudLightning,
  ArrowLeft
} from '../../../shared/icons/Icons'

interface ResetPasswordViewProps {
  email: string
  code: string
  isLoading: boolean
  onBackToOtp: () => void
  onPasswordReset: (newPassword: string, logoutOtherSessions: boolean) => void
}

export const ResetPasswordView: React.FC<ResetPasswordViewProps> = ({
  email,
  isLoading,
  onBackToOtp,
  onPasswordReset
}) => {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [logoutOtherSessions, setLogoutOtherSessions] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Policy Checks
  const hasMinLength = newPassword.length >= 8
  const hasUpperCase = /[A-Z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword

  // Strength score: 0 to 4
  const strengthScore = [hasMinLength, hasUpperCase, hasNumber, hasSpecialChar].filter(
    Boolean
  ).length

  const getStrengthLabel = (): { text: string; color: string } => {
    switch (strengthScore) {
      case 4:
        return { text: '100% - Fuerte y Segura', color: 'text-[#107C41]' }
      case 3:
        return { text: '75% - Nivel Bueno', color: 'text-[#0067C0]' }
      case 2:
        return { text: '50% - Nivel Medio', color: 'text-[#D97706]' }
      default:
        return { text: 'Débil (insegura)', color: 'text-[#C42B1C]' }
    }
  }

  const getBarColor = (index: number): string => {
    if (index >= strengthScore) return 'bg-[#E5E5E5]'
    if (strengthScore === 4) return 'bg-[#107C41]'
    if (strengthScore === 3) return 'bg-[#0067C0]'
    if (strengthScore === 2) return 'bg-[#D97706]'
    return 'bg-[#C42B1C]'
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!hasMinLength) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (!isMatch) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }
    onPasswordReset(newPassword, logoutOtherSessions)
  }

  const strengthInfo = getStrengthLabel()

  return (
    <div className="w-full max-w-[620px] bg-white/95 backdrop-blur-2xl rounded-xl shadow-xl flex flex-col overflow-hidden border border-[#E5E5E5] animate-modal">
      {/* Top Gradient Accent Ribbon */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0067C0] via-[#0078D4] to-[#107C41]" />

      <div className="p-6 flex flex-col gap-4">
        {/* Navigation & Step */}
        <div className="flex items-center justify-between border-b border-[#F3F3F3] pb-3">
          <button
            type="button"
            onClick={onBackToOtp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F3F3F3] hover:bg-[#E8E8E8] text-[#1B1B1B] text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} className="text-[#0067C0]" />
            <span>Volver a Código OTP</span>
            <span className="font-mono text-[10px] bg-[#E8E8E8] text-[#5C5C5C] px-1 rounded ml-1">
              ESC
            </span>
          </button>
          <span className="font-mono text-xs font-semibold text-[#5C5C5C]">
            Cuenta: <strong className="text-[#1B1B1B]">{email}</strong>
          </span>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[10px] text-[#0067C0] uppercase font-bold tracking-wider">
            Paso 2 de 2 • Restablecimiento
          </span>
          <h2 className="text-lg font-bold text-[#1B1B1B]">Definir Nueva Clave Corporativa</h2>
          <p className="text-xs text-[#5C5C5C]">
            Establezca una contraseña segura que cumpla con los estándares de seguridad de terminales POS.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-2 p-3 bg-[#FDE8E8] border border-[#F5C2C7] rounded-md text-[#C42B1C] text-xs animate-modal">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="font-medium">{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Field: New Password */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="newPassInput" className="text-xs font-semibold text-[#1B1B1B] flex items-center gap-1">
                <Lock size={14} className="text-[#0067C0]" />
                <span>Nueva Contraseña</span>
              </label>
              <span className={`font-mono text-[11px] font-bold ${strengthInfo.color}`}>
                {strengthInfo.text}
              </span>
            </div>
            <div className="relative flex items-center">
              <input
                id="newPassInput"
                type={showNewPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value)
                  setErrorMessage(null)
                }}
                placeholder="Ingrese nueva contraseña segura"
                className="w-full h-10 pl-3 pr-10 rounded-md bg-[#F3F3F3] focus:bg-white text-xs font-mono text-[#1B1B1B] border border-[#D1D5DB] focus:border-transparent focus:shadow-[0_0_0_2px_#0067C0] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-2.5 h-6 w-6 flex items-center justify-center text-[#717783] hover:text-[#1B1B1B]"
              >
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength Meter 4 Bars */}
            <div className="grid grid-cols-4 gap-1.5 h-1.5 pt-1">
              <div className={`rounded-full transition-all duration-300 ${getBarColor(0)}`} />
              <div className={`rounded-full transition-all duration-300 ${getBarColor(1)}`} />
              <div className={`rounded-full transition-all duration-300 ${getBarColor(2)}`} />
              <div className={`rounded-full transition-all duration-300 ${getBarColor(3)}`} />
            </div>

            {/* Policy Chips */}
            <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  hasMinLength ? 'bg-[#E8F5E9] text-[#107C41] font-semibold' : 'bg-[#F3F3F3] text-[#717783]'
                }`}
              >
                <Check size={13} className={hasMinLength ? 'text-[#107C41]' : 'opacity-40'} />
                <span>Mínimo 8 caracteres</span>
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  hasUpperCase ? 'bg-[#E8F5E9] text-[#107C41] font-semibold' : 'bg-[#F3F3F3] text-[#717783]'
                }`}
              >
                <Check size={13} className={hasUpperCase ? 'text-[#107C41]' : 'opacity-40'} />
                <span>Al menos una mayúscula</span>
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  hasNumber ? 'bg-[#E8F5E9] text-[#107C41] font-semibold' : 'bg-[#F3F3F3] text-[#717783]'
                }`}
              >
                <Check size={13} className={hasNumber ? 'text-[#107C41]' : 'opacity-40'} />
                <span>Al menos un número</span>
              </div>
              <div
                className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                  hasSpecialChar ? 'bg-[#E8F5E9] text-[#107C41] font-semibold' : 'bg-[#F3F3F3] text-[#717783]'
                }`}
              >
                <Check size={13} className={hasSpecialChar ? 'text-[#107C41]' : 'opacity-40'} />
                <span>Carácter especial (@, #, $)</span>
              </div>
            </div>
          </div>

          {/* Field: Confirm Password */}
          <div className="flex flex-col gap-1.5 pt-1">
            <label htmlFor="confirmPassInput" className="text-xs font-semibold text-[#1B1B1B]">
              Confirmar Nueva Contraseña
            </label>
            <div className="relative flex items-center">
              <input
                id="confirmPassInput"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setErrorMessage(null)
                }}
                placeholder="Repita la nueva contraseña"
                className="w-full h-10 pl-3 pr-10 rounded-md bg-[#F3F3F3] focus:bg-white text-xs font-mono text-[#1B1B1B] border border-[#D1D5DB] focus:border-transparent focus:shadow-[0_0_0_2px_#0067C0] outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 h-6 w-6 flex items-center justify-center text-[#717783] hover:text-[#1B1B1B]"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {isMatch && (
              <div className="flex items-center gap-1 text-[11px] text-[#107C41] font-semibold pt-0.5">
                <CheckCircle2 size={14} />
                <span>Las contraseñas coinciden de forma idéntica</span>
              </div>
            )}
          </div>

          {/* Logout others checkbox */}
          <label className="flex items-start gap-2 p-2.5 rounded-md bg-[#F8F9FA] border border-[#E9ECEF] cursor-pointer select-none">
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
                Desconectará POS-02 y terminales secundarios inmediatamente
              </span>
            </div>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onBackToOtp}
              className="h-10 px-4 rounded-md bg-[#F3F3F3] hover:bg-[#E8E8E8] text-xs font-semibold text-[#1B1B1B] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !hasMinLength || !isMatch}
              className="h-10 px-5 rounded-md bg-[#0067C0] hover:bg-[#0078D4] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <CloudLightning size={16} />
              <span>{isLoading ? 'Actualizando...' : 'Actualizar e Iniciar Sesión'}</span>
              <span className="font-mono text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold">
                ENTER
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Card Footer */}
      <div className="px-6 py-2.5 bg-[#F8F9FA] border-t border-[#E5E5E5] flex items-center justify-between text-[11px] text-[#717783] select-none font-mono">
        <span>Active Directory Security • PCI-DSS Compliant</span>
        <span>LATENCIA: 18ms</span>
      </div>
    </div>
  )
}

export default ResetPasswordView
