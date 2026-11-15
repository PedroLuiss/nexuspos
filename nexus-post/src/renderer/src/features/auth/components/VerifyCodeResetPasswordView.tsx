import React, { useState, useEffect, useRef } from 'react'
import {
  ShieldCheck,
  Key,
  Lock,
  LockKeyhole,
  Eye,
  EyeOff,
  Check,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Timer,
  CloudLightning,
  Info,
  ArrowRight
} from '../../../shared/icons/Icons'

interface VerifyCodeResetPasswordViewProps {
  email: string
  onBackToLogin: () => void
  onCompleteReset: (newPassword: string, logoutOtherSessions: boolean) => Promise<boolean>
  isLoading: boolean
}

// ─── OTP Panel (izquierda, 5 cols) ───────────────────────────────────────────
interface OtpPanelProps {
  otpVerified: boolean
  onOtpVerified: () => void
}

function OtpPanel({ otpVerified, onOtpVerified }: OtpPanelProps): React.JSX.Element {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [timeLeft, setTimeLeft] = useState(600)
  const [resendCooldown, setResendCooldown] = useState(45)
  const [otpError, setOtpError] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((p) => (p > 0 ? p - 1 : 0))
      setResendCooldown((p) => (p > 0 ? p - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTimer = (s: number): string => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')} min`
  }

  const tryVerify = (code: string): void => {
    // Mock: cualquier 6 dígitos es válido (o "849215" como demo)
    if (code.length === 6) {
      setOtpError(null)
      onOtpVerified()
    }
  }

  const handleDigitChange = (index: number, val: string): void => {
    if (otpVerified) return
    const char = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    setOtpError(null)
    if (char && index < 5) inputRefs.current[index + 1]?.focus()
    if (char && index === 5 && next.every((d) => d !== '')) tryVerify(next.join(''))
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent): void => {
    if (otpVerified) return
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setDigits(pasted.split(''))
      tryVerify(pasted)
    }
  }

  const handleManualVerify = (): void => {
    const code = digits.join('')
    if (code.length !== 6) {
      setOtpError('Ingrese los 6 dígitos completos del código.')
      return
    }
    tryVerify(code)
  }

  return (
    <div className="lg:col-span-5 flex flex-col gap-4">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-[#1B1B1B] flex items-center gap-1.5">
          <Key size={15} className="text-[#0067C0]" />
          Código de Autorización OTP
        </label>
        <span className="font-mono text-[10px] text-[#0067C0] bg-[#EFF6FC] px-2 py-0.5 rounded font-bold">
          [F2] ENFOCAR
        </span>
      </div>
      <p className="text-xs text-[#5C5C5C] -mt-2">
        Ingrese los 6 dígitos numéricos recibidos en su correo corporativo.
      </p>

      {/* 6-digit boxes */}
      <div className={`flex items-center justify-between gap-1.5 ${otpVerified ? 'opacity-60 pointer-events-none' : ''}`} onPaste={handlePaste}>
        {digits.map((digit, idx) => (
          <React.Fragment key={idx}>
            {idx === 3 && (
              <span className="font-bold text-lg text-[#717783] select-none">-</span>
            )}
            <input
              ref={(el) => { inputRefs.current[idx] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              autoFocus={idx === 0 && !otpVerified}
              className="w-12 h-14 text-center font-mono text-2xl font-bold text-[#1B1B1B] bg-[#F3F3F3] focus:bg-white rounded-xl border border-[#D1D5DB] focus:border-transparent focus:shadow-[0_0_0_2px_#0067C0] outline-none transition-all shadow-sm"
            />
          </React.Fragment>
        ))}
      </div>

      {/* OTP Error */}
      {otpError && !otpVerified && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[#FDE8E8] border border-[#F5C2C7] text-[#C42B1C] text-xs animate-modal">
          <AlertCircle size={14} className="flex-shrink-0" />
          <span className="font-medium">{otpError}</span>
        </div>
      )}

      {/* OTP Verified Banner */}
      {otpVerified ? (
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9] text-[#107C41] animate-modal">
          <div className="w-6 h-6 rounded-full bg-[#107C41] text-white flex items-center justify-center shadow-sm flex-shrink-0">
            <Check size={14} />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold">Código verificado correctamente</span>
            <span className="text-[11px] opacity-80">Token firmado por Active Directory RSA-4096</span>
          </div>
        </div>
      ) : (
        /* Verify button when not auto-verified */
        <button
          type="button"
          onClick={handleManualVerify}
          disabled={digits.some((d) => d === '')}
          className="flex items-center justify-center gap-2 h-10 rounded-xl bg-[#0067C0] hover:bg-[#0078D4] text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ShieldCheck size={15} />
          <span>Verificar Código OTP</span>
          <ArrowRight size={15} />
        </button>
      )}

      {/* Countdown Timer */}
      <div className="p-3 rounded-xl bg-[#F3F3F3] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#5C5C5C] flex items-center gap-1.5">
            <Timer size={14} className="text-[#C42B1C]" />
            Expiración del token:
          </span>
          <span className="font-mono text-xs font-bold text-[#1B1B1B] bg-white px-2 py-0.5 rounded border border-[#E5E5E5]">
            {formatTimer(timeLeft)}
          </span>
        </div>
        <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#0067C0] h-full transition-all duration-1000"
            style={{ width: `${(timeLeft / 600) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs pt-0.5">
          <span className="text-[#717783]">¿No recibió el correo?</span>
          <button
            type="button"
            disabled={resendCooldown > 0 || otpVerified}
            onClick={() => setResendCooldown(45)}
            className="font-semibold text-[#0067C0] disabled:text-[#888] disabled:cursor-not-allowed hover:underline cursor-pointer"
          >
            {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar OTP'}
          </button>
        </div>
      </div>

      {/* Security Tip */}
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F3F3F3] text-[#5C5C5C]">
        <Info size={16} className="text-[#0067C0] mt-0.5 flex-shrink-0" />
        <p className="text-xs leading-relaxed">
          Los tokens OTP son de uso único. Si usted no solicitó este cambio, notifique al
          Administrador de Tienda de inmediato.
        </p>
      </div>

      {/* Demo hint */}
      <p className="text-center font-mono text-[10px] text-[#A0A0A0]">
        Código demo: <strong>849215</strong>
      </p>
    </div>
  )
}

// ─── Reset Password Panel (derecha, 6 cols) ───────────────────────────────────
interface ResetPanelProps {
  enabled: boolean
  isLoading: boolean
  onCancel: () => void
  onSubmit: (password: string, logoutOthers: boolean) => Promise<boolean>
}

function ResetPanel({ enabled, isLoading, onCancel, onSubmit }: ResetPanelProps): React.JSX.Element {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [logoutOthers, setLogoutOthers] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const hasMinLength = newPassword.length >= 8
  const hasUpperCase = /[A-Z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword

  const strengthScore = [hasMinLength, hasUpperCase, hasNumber, hasSpecialChar].filter(Boolean).length

  const getBarColor = (i: number): string => {
    if (i >= strengthScore) return 'bg-[#E5E5E5]'
    if (strengthScore === 4) return 'bg-[#107C41]'
    if (strengthScore === 3) return 'bg-[#0067C0]'
    if (strengthScore === 2) return 'bg-[#D97706]'
    return 'bg-[#C42B1C]'
  }

  const getStrengthLabel = (): { text: string; color: string } => {
    if (strengthScore === 4) return { text: '100% - Fuerte y Segura', color: 'text-[#107C41]' }
    if (strengthScore === 3) return { text: '75% - Nivel Bueno', color: 'text-[#0067C0]' }
    if (strengthScore === 2) return { text: '50% - Nivel Medio', color: 'text-[#D97706]' }
    return { text: 'Débil (insegura)', color: 'text-[#C42B1C]' }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!hasMinLength) { setErrorMessage('La contraseña debe tener al menos 8 caracteres.'); return }
    if (!isMatch) { setErrorMessage('Las contraseñas no coinciden.'); return }
    await onSubmit(newPassword, logoutOthers)
  }

  const strengthInfo = getStrengthLabel()

  // Locked overlay when OTP not yet verified
  if (!enabled) {
    return (
      <div className="lg:col-span-6 flex flex-col gap-4 bg-[#F8F9FA]/50 p-5 rounded-2xl relative overflow-hidden">
        {/* Blurred content */}
        <div className="blur-sm pointer-events-none select-none opacity-50">
          <div className="h-4 w-40 bg-[#E5E5E5] rounded mb-2" />
          <div className="h-6 w-56 bg-[#E5E5E5] rounded mb-1" />
          <div className="h-3 w-72 bg-[#E5E5E5] rounded mb-6" />
          <div className="h-11 w-full bg-[#E5E5E5] rounded-xl mb-3" />
          <div className="grid grid-cols-4 gap-1.5 h-1.5 mb-3">
            {[0,1,2,3].map(i => <div key={i} className="rounded-full bg-[#E5E5E5]" />)}
          </div>
          <div className="h-11 w-full bg-[#E5E5E5] rounded-xl" />
        </div>
        {/* Lock overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/60 backdrop-blur-sm rounded-2xl">
          <div className="w-12 h-12 rounded-full bg-[#F3F3F3] border border-[#E5E5E5] flex items-center justify-center text-[#717783]">
            <Lock size={24} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-[#1B1B1B]">Verificación requerida</p>
            <p className="text-xs text-[#717783] mt-0.5">
              Ingrese y verifique el código OTP para continuar.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="lg:col-span-6 flex flex-col gap-4 bg-[#F8F9FA]/50 p-5 rounded-2xl">
      <div>
        <span className="font-mono text-[10px] text-[#717783] uppercase tracking-wider">Paso 2 de 2</span>
        <h2 className="text-base font-bold text-[#1B1B1B] mt-0.5">Definir Nueva Clave Corporativa</h2>
        <p className="text-xs text-[#5C5C5C]">
          Establezca una contraseña segura que cumpla con los estándares de PCI-DSS.
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-[#FDE8E8] border border-[#F5C2C7] rounded-lg text-[#C42B1C] text-xs animate-modal">
          <AlertCircle size={14} className="shrink-0 mt-0.5" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* New Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="newPassInput" className="text-xs font-semibold text-[#1B1B1B] flex items-center gap-1.5">
              <Lock size={13} className="text-[#0067C0]" />
              Nueva Contraseña
            </label>
            <span className={`font-mono text-[11px] font-bold ${strengthInfo.color}`}>
              {strengthInfo.text}
            </span>
          </div>
          <div className="relative flex items-center">
            <input
              id="newPassInput"
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              required
              autoFocus
              onChange={(e) => { setNewPassword(e.target.value); setErrorMessage(null) }}
              placeholder="Ingrese nueva contraseña segura"
              className="w-full h-11 px-3 pr-11 rounded-xl bg-white font-mono text-sm text-[#1B1B1B] border border-[#D1D5DB] focus:border-transparent focus:shadow-[0_0_0_2px_#0067C0] outline-none transition-all shadow-sm"
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-2.5 h-7 w-7 flex items-center justify-center text-[#717783] hover:text-[#1B1B1B] cursor-pointer"
            >
              {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {/* Strength Bars */}
          <div className="grid grid-cols-4 gap-1.5 h-1.5 mt-0.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`rounded-full transition-all duration-300 ${getBarColor(i)}`} />
            ))}
          </div>

          {/* Policy Chips */}
          <div className="grid grid-cols-2 gap-1.5 mt-0.5">
            {[
              { ok: hasMinLength, label: 'Mínimo 8 caracteres' },
              { ok: hasUpperCase, label: 'Al menos una mayúscula' },
              { ok: hasNumber, label: 'Al menos un número' },
              { ok: hasSpecialChar, label: 'Carácter especial (@, #, $)' }
            ].map(({ ok, label }) => (
              <div
                key={label}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] transition-colors ${
                  ok ? 'bg-[#E8F5E9] text-[#107C41] font-semibold' : 'bg-[#F3F3F3] text-[#717783]'
                }`}
              >
                <Check size={12} className={ok ? 'text-[#107C41]' : 'opacity-30'} />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassInput" className="text-xs font-semibold text-[#1B1B1B] flex items-center gap-1.5">
            <LockKeyhole size={13} className="text-[#0067C0]" />
            Confirmar Nueva Contraseña
          </label>
          <div className="relative flex items-center">
            <input
              id="confirmPassInput"
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              required
              onChange={(e) => { setConfirmPassword(e.target.value); setErrorMessage(null) }}
              placeholder="Repita la nueva contraseña"
              className="w-full h-11 px-3 pr-11 rounded-xl bg-white font-mono text-sm text-[#1B1B1B] border border-[#D1D5DB] focus:border-transparent focus:shadow-[0_0_0_2px_#0067C0] outline-none transition-all shadow-sm"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-2.5 h-7 w-7 flex items-center justify-center text-[#717783] hover:text-[#1B1B1B] cursor-pointer"
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {isMatch && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#107C41] font-semibold animate-modal">
              <CheckCircle2 size={13} />
              <span>Las contraseñas coinciden de forma idéntica</span>
            </div>
          )}
        </div>

        {/* Logout Other Sessions */}
        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-white border border-[#E5E5E5] cursor-pointer hover:bg-[#F8F9FA] transition-colors shadow-sm select-none">
          <input
            type="checkbox"
            checked={logoutOthers}
            onChange={(e) => setLogoutOthers(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded accent-[#0067C0] cursor-pointer"
          />
          <div className="flex flex-col text-xs">
            <span className="font-semibold text-[#1B1B1B]">
              Cerrar sesiones activas en todos los demás terminales
            </span>
            <span className="text-[11px] text-[#717783] mt-0.5">
              Desconectará POS-01, POS-02 y la App Móvil de Almacén inmediatamente
            </span>
          </div>
        </label>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#F3F3F3] hover:bg-[#E8E8E8] text-[#1B1B1B] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <span className="font-mono text-[10px] bg-[#E8E8E8] text-[#5C5C5C] px-1.5 py-0.5 rounded">ESC</span>
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isLoading || !hasMinLength || !isMatch}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0067C0] hover:bg-[#0078D4] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 group cursor-pointer"
          >
            <CloudLightning size={15} className="group-hover:scale-110 transition-transform" />
            <span>{isLoading ? 'Actualizando...' : 'Actualizar Contraseña e Iniciar Sesión'}</span>
            <span className="font-mono text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-bold">ENTER</span>
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Main Composed View ───────────────────────────────────────────────────────
export const VerifyCodeResetPasswordView: React.FC<VerifyCodeResetPasswordViewProps> = ({
  email,
  onBackToLogin,
  onCompleteReset,
  isLoading
}) => {
  const [otpVerified, setOtpVerified] = useState(false)
  const initials = email ? email.substring(0, 2).toUpperCase() : 'OP'

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-3 animate-modal">
      {/* ── Top Nav Bar ── */}
      <div className="w-full flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToLogin}
          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white border border-[#E5E5E5] text-[#1B1B1B] text-xs font-semibold transition-all shadow-sm cursor-pointer"
        >
          <ArrowLeft size={15} className="text-[#0067C0] group-hover:-translate-x-0.5 transition-transform" />
          <span>Volver al Inicio de Sesión</span>
          <span className="font-mono text-[10px] bg-[#E8E8E8] text-[#5C5C5C] px-1.5 py-0.5 rounded ml-1">ESC</span>
        </button>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/60 backdrop-blur-sm border border-[#E5E5E5]">
          <span className="w-2 h-2 rounded-full bg-[#107C41] animate-pulse" />
          <span className="font-mono text-[10px] text-[#5C5C5C] uppercase tracking-wider font-semibold">
            CANAL CIFRADO TLS 1.3
          </span>
        </div>
      </div>

      {/* ── Main Canvas Card ── */}
      <div className="w-full bg-white/95 backdrop-blur-2xl rounded-2xl shadow-xl overflow-hidden border border-[#E5E5E5] relative">
        {/* Ambient blobs */}
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-[#0067C0]/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-[#107C41]/8 rounded-full blur-3xl pointer-events-none" />

        {/* ── Window Header Band ── */}
        <div className="relative px-6 pt-5 pb-4 bg-[#F8F9FA]/70 backdrop-blur-sm border-b border-[#E5E5E5]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Title */}
            <div className="flex items-start gap-4">
              <div className="relative w-14 h-14 rounded-xl bg-[#0067C0] text-white flex items-center justify-center shadow-md flex-shrink-0">
                <ShieldCheck size={28} />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#107C41] text-white flex items-center justify-center shadow-sm">
                  <Key size={11} />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-[10px] text-[#0067C0] font-bold uppercase tracking-wider">
                    Módulo de Autenticación Central
                  </span>
                  <span className="text-[#D1D5DB]">•</span>
                  <span className="font-mono text-[10px] text-[#717783]">Ticket #AUTH-98214</span>
                </div>
                <h1 className="text-xl font-bold text-[#1B1B1B] tracking-tight">
                  Verificar Código y Restablecer Contraseña
                </h1>
                <p className="text-xs text-[#5C5C5C] mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>Código enviado a</span>
                  <span className="font-mono font-semibold text-[#1B1B1B] bg-[#F3F3F3] border border-[#E5E5E5] px-2 py-0.5 rounded-lg">
                    {email || 'cajero.central@nexuspos.pe'}
                  </span>
                </p>
              </div>
            </div>

            {/* Operator Badge */}
            <div className="flex items-center gap-3 bg-[#F3F3F3] px-4 py-2.5 rounded-xl flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#E5E5E5] flex items-center justify-center text-[#1B1B1B] text-sm font-bold">
                {initials}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-[#1B1B1B]">Operador</span>
                <span className="text-[11px] text-[#717783]">Cajero • POS-04</span>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className={`flex items-center gap-2.5 p-2.5 rounded-xl shadow-sm border transition-colors ${
              otpVerified ? 'bg-[#E8F5E9] border-[#C8E6C9]' : 'bg-white border-[#E5E5E5]'
            }`}>
              <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${
                otpVerified ? 'bg-[#107C41]' : 'bg-[#0067C0]'
              }`}>
                {otpVerified ? <Check size={14} /> : '1'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[#1B1B1B] truncate">Código Temporal OTP</span>
                <span className={`text-[11px] font-medium flex items-center gap-1 ${otpVerified ? 'text-[#107C41]' : 'text-[#0067C0]'}`}>
                  <CheckCircle2 size={12} />
                  {otpVerified ? 'Verificado' : 'Verificación requerida'}
                </span>
              </div>
            </div>
            <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border shadow-sm transition-colors ${
              otpVerified ? 'bg-white border-[#0067C0]/30' : 'bg-[#F3F3F3] border-[#E5E5E5]'
            }`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors ${
                otpVerified ? 'bg-[#0067C0] text-white' : 'bg-[#E5E5E5] text-[#717783]'
              }`}>
                2
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[#1B1B1B] truncate">Nueva Contraseña Corporativa</span>
                <span className="text-[11px] text-[#717783]">
                  {otpVerified ? 'Listo para configurar' : 'Requiere OTP verificado'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Split Panes ── */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: OTP (5 cols) */}
          <OtpPanel
            otpVerified={otpVerified}
            onOtpVerified={() => setOtpVerified(true)}
          />

          {/* Divider */}
          <div className="hidden lg:flex lg:col-span-1 items-stretch justify-center">
            <div className="w-px bg-[#E5E5E5]" />
          </div>

          {/* RIGHT: New Password (6 cols) */}
          <ResetPanel
            enabled={otpVerified}
            isLoading={isLoading}
            onCancel={onBackToLogin}
            onSubmit={onCompleteReset}
          />
        </div>

        {/* ── Window Status Bar ── */}
        <div className="px-6 py-2.5 bg-[#F3F3F3] border-t border-[#E5E5E5] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#717783] font-mono">
          <span className="flex items-center gap-2">
            <ShieldCheck size={13} className="text-[#107C41]" />
            NexusPOS v4.8.2 Security Module • Active Directory / PostgreSQL
          </span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#107C41]" />
              AD SYNC READY
            </span>
            <span>LATENCIA: 18ms</span>
          </div>
        </div>
      </div>

      {/* ── Audit Meta Footer ── */}
      <div className="flex items-center justify-between px-1 text-[10px] text-[#717783] font-mono opacity-70">
        <div className="flex items-center gap-4">
          <span>SESSION ID: #004-SEC-92934-LIMA</span>
          <span>IP: 192.168.10.45</span>
        </div>
        <span>DESKTOP ENTERPRISE WINUI-3 FLUENT RUNTIME</span>
      </div>
    </div>
  )
}

export default VerifyCodeResetPasswordView
