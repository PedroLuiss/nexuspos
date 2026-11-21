import React, { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  CloudLightning,
  Eye,
  EyeOff,
  Key,
  Lock,
  ShieldCheck,
  Timer
} from '../../../shared/icons/Icons'
import { PasswordRecoveryHeader } from './PasswordRecoveryHeader'

interface VerifyCodeResetPasswordViewProps {
  email: string
  otpVerified: boolean
  isLoading: boolean
  onBackToLogin: () => void
  onVerifyOtp: (code: string) => Promise<boolean>
  onResendOtp: () => Promise<boolean>
  onCompleteReset: (newPassword: string, logoutOtherSessions: boolean) => Promise<boolean>
}

export const VerifyCodeResetPasswordView: React.FC<VerifyCodeResetPasswordViewProps> = ({
  email,
  otpVerified,
  isLoading,
  onBackToLogin,
  onVerifyOtp,
  onResendOtp,
  onCompleteReset
}) => {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [timeLeft, setTimeLeft] = useState(600)
  const [resendCooldown, setResendCooldown] = useState(45)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((remaining) => Math.max(remaining - 1, 0))
      setResendCooldown((remaining) => Math.max(remaining - 1, 0))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  const verifyCode = async (code: string): Promise<void> => {
    if (code.length !== 6 || isLoading || otpVerified) return
    if (timeLeft === 0) {
      setErrorMessage('El código expiró. Solicite uno nuevo.')
      return
    }

    setErrorMessage(null)
    const verified = await onVerifyOtp(code)
    if (!verified) setErrorMessage('El código no es válido o ya expiró.')
  }

  const handleDigitChange = (index: number, value: string): void => {
    if (isLoading || otpVerified) return
    const digit = value.replace(/\D/g, '').slice(-1)
    const nextDigits = [...digits]
    nextDigits[index] = digit
    setDigits(nextDigits)
    setErrorMessage(null)
    if (digit && index < 5) inputRefs.current[index + 1]?.focus()
    if (digit && nextDigits.every(Boolean)) void verifyCode(nextDigits.join(''))
  }

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>): void => {
    event.preventDefault()
    if (isLoading || otpVerified) return
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length !== 6) return
    setDigits(pasted.split(''))
    void verifyCode(pasted)
  }

  const resendCode = async (): Promise<void> => {
    if (isLoading || resendCooldown > 0) return
    setErrorMessage(null)
    if (await onResendOtp()) {
      setDigits(Array(6).fill(''))
      setTimeLeft(600)
      setResendCooldown(45)
      inputRefs.current[0]?.focus()
    }
  }

  const submitPassword = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    if (!otpVerified) return
    if (newPassword.length < 8) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.')
      return
    }

    setErrorMessage(null)
    if (!(await onCompleteReset(newPassword, true))) {
      setErrorMessage('No se pudo actualizar la contraseña. Intente nuevamente.')
    }
  }

  const formatTimer = (seconds: number): string =>
    `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return (
    <section className="w-full max-w-4xl overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-xl">
      <PasswordRecoveryHeader email={email} onBackToLogin={onBackToLogin} />

      <div className="grid gap-6 p-5 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold">
              <Key size={15} className="text-[#0067C0]" />
              Código de seis dígitos
            </label>
            <span className="flex items-center gap-1 font-mono text-xs text-slate-600">
              <Timer size={14} />
              {formatTimer(timeLeft)}
            </span>
          </div>
          <p className="text-xs text-[#5C5C5C]">
            Ingrese el código recibido en el correo asociado a su cuenta.
          </p>
          <div className="flex items-center justify-between gap-1.5" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                disabled={otpVerified || isLoading}
                onChange={(event) => handleDigitChange(index, event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Backspace' && !digits[index] && index > 0) {
                    inputRefs.current[index - 1]?.focus()
                  }
                }}
                className="h-12 w-10 rounded border border-[#D1D5DB] bg-[#F3F3F3] text-center font-mono text-xl font-bold focus:border-[#0067C0] focus:bg-white sm:w-12"
              />
            ))}
          </div>
          {otpVerified ? (
            <div className="flex items-center gap-2 rounded border border-emerald-200 bg-emerald-50 p-2 text-xs font-semibold text-emerald-800">
              <CheckCircle2 size={15} />
              Código verificado
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isLoading || digits.some((digit) => !digit) || timeLeft === 0}
                onClick={() => void verifyCode(digits.join(''))}
                className="flex flex-1 items-center justify-center gap-1.5 rounded bg-[#0067C0] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0078D4] disabled:opacity-50"
              >
                <ShieldCheck size={14} />
                {isLoading ? 'Verificando…' : 'Verificar código'}
              </button>
              <button
                type="button"
                disabled={isLoading || resendCooldown > 0}
                onClick={() => void resendCode()}
                className="rounded border border-[#D1D1D1] px-3 py-2 text-xs font-semibold disabled:opacity-50"
              >
                {resendCooldown > 0 ? `Reenviar (${resendCooldown}s)` : 'Reenviar'}
              </button>
            </div>
          )}
        </div>

        <form onSubmit={(event) => void submitPassword(event)} className="space-y-3">
          <div>
            <label
              htmlFor="reset-new-password"
              className="flex items-center gap-2 text-xs font-semibold"
            >
              <Lock size={14} className="text-[#0067C0]" />
              Nueva contraseña
            </label>
            <div className="relative mt-1">
              <input
                id="reset-new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={8}
                value={newPassword}
                disabled={!otpVerified || isLoading}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded border border-[#D1D1D1] px-3 py-2 pr-10 text-sm disabled:bg-slate-100"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                onClick={() => setShowPassword((shown) => !shown)}
                className="absolute right-2 top-2 text-slate-500"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div>
            <label
              htmlFor="reset-confirm-password"
              className="flex items-center gap-2 text-xs font-semibold"
            >
              <Lock size={14} className="text-[#0067C0]" />
              Confirmar contraseña
            </label>
            <div className="relative mt-1">
              <input
                id="reset-confirm-password"
                type={showConfirmation ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                disabled={!otpVerified || isLoading}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded border border-[#D1D1D1] px-3 py-2 pr-10 text-sm disabled:bg-slate-100"
              />
              <button
                type="button"
                aria-label={showConfirmation ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                onClick={() => setShowConfirmation((shown) => !shown)}
                className="absolute right-2 top-2 text-slate-500"
              >
                {showConfirmation ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && confirmPassword === newPassword && (
              <p className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700">
                <Check size={13} />
                Las contraseñas coinciden
              </p>
            )}
          </div>
          {!otpVerified && (
            <p className="text-xs text-slate-500">
              Verifique primero el código para habilitar el cambio.
            </p>
          )}
          <button
            type="submit"
            disabled={
              !otpVerified || isLoading || newPassword.length < 8 || newPassword !== confirmPassword
            }
            className="flex w-full items-center justify-center gap-2 rounded bg-[#107C41] px-3 py-2.5 text-xs font-bold text-white hover:bg-[#0F6B38] disabled:opacity-50"
          >
            <CloudLightning size={15} />
            {isLoading ? 'Actualizando…' : 'Actualizar contraseña'}
            <ArrowRight size={14} />
          </button>
        </form>

        {errorMessage && (
          <div
            role="alert"
            className="md:col-span-2 flex items-center gap-2 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-800"
          >
            <AlertCircle size={15} />
            {errorMessage}
          </div>
        )}
      </div>
    </section>
  )
}

export default VerifyCodeResetPasswordView
