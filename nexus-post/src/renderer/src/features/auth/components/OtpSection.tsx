import React, { useState, useEffect, useRef } from 'react'
import { Check, Timer, Info } from '../../../shared/icons/Icons'

interface OtpSectionProps {
  onCodeChange?: (code: string) => void
}

export const OtpSection: React.FC<OtpSectionProps> = ({ onCodeChange }) => {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''))
  const [timeLeft, setTimeLeft] = useState(525) // 08:45 min
  const [resendCooldown, setResendCooldown] = useState(45)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} min`
  }

  const handleDigitChange = (index: number, val: string): void => {
    const char = val.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[index] = char
    setDigits(next)
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
    onCodeChange?.(next.join(''))
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const isComplete = digits.every((d) => d !== '')

  return (
    <div className="flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        {/* Label & Focus Tag */}
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#1B1B1B] flex items-center gap-1.5">
            <span>Código de Autorización OTP</span>
          </label>
          <span className="font-mono text-[10px] text-[#0067C0] bg-[#EFF6FC] px-2 py-0.5 rounded font-bold border border-[#0067C0]/20">
            [F2] ENFOCAR
          </span>
        </div>

        <p className="text-xs text-[#5C5C5C] leading-relaxed">
          Ingrese los 6 dígitos numéricos recibidos en su correo corporativo para validar la sesión
          de recuperación.
        </p>

        {/* 6-Digit Fluent Boxes */}
        <div className="flex items-center justify-between gap-1.5 pt-1">
          {digits.map((digit, idx) => (
            <React.Fragment key={idx}>
              {idx === 3 && (
                <div className="text-[#717783] font-bold text-base select-none px-0.5">-</div>
              )}
              <input
                ref={(el) => {
                  inputRefs.current[idx] = el
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-10 h-13 sm:w-11 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold text-[#1B1B1B] bg-[#F3F3F3] focus:bg-white rounded-lg shadow-2xs focus:shadow-md focus:shadow-[#0067C0]/20 border border-[#D1D5DB] focus:border-transparent outline-none transition-all"
              />
            </React.Fragment>
          ))}
        </div>

        {/* OTP Verified Status Banner */}
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#E8F5E9] text-[#006D37] border border-[#A7F3D0]">
          <div className="w-5 h-5 rounded-full bg-[#107C41] flex items-center justify-center text-white shrink-0 shadow-2xs">
            <Check size={13} />
          </div>
          <div className="flex flex-col text-xs leading-tight">
            <span className="font-bold">
              {isComplete
                ? 'Código completo; pendiente de validar'
                : 'Esperando ingreso de 6 dígitos'}
            </span>
            <span className="text-[10px] opacity-80">
              El código debe validarse con el servicio de autenticación
            </span>
          </div>
        </div>

        {/* Countdown Timer & Resend Card */}
        <div className="p-3 rounded-lg bg-[#F8F9FA] border border-[#E9ECEF] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-[#5C5C5C]">
            <span className="flex items-center gap-1.5 font-medium">
              <Timer size={14} className="text-[#C42B1C]" />
              Expiración del token:
            </span>
            <span className="font-mono text-xs font-bold text-[#1B1B1B] bg-[#E8E8E8] px-2 py-0.5 rounded">
              {formatTimer(timeLeft)}
            </span>
          </div>
          <div className="w-full bg-[#E5E5E5] rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-[#0067C0] h-full rounded-full transition-all duration-1000"
              style={{ width: `${(timeLeft / 600) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="text-[#717783] text-[11px]">¿No recibió el correo?</span>
            <button
              type="button"
              disabled={resendCooldown > 0}
              onClick={() => setResendCooldown(45)}
              className="font-semibold text-xs text-[#0067C0] disabled:text-[#888] disabled:cursor-not-allowed hover:underline cursor-pointer"
            >
              {resendCooldown > 0 ? `Reenviar OTP en ${resendCooldown}s` : 'Reenviar código'}
            </button>
          </div>
        </div>
      </div>

      {/* Security Tip */}
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-[#F3F3F3] text-[#5C5C5C] text-xs">
        <Info size={16} className="text-[#0067C0] shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          Los tokens OTP son de uso único e intransferible. Si usted no solicitó este cambio,
          notifique al Administrador de Tienda o Seguridad TI.
        </p>
      </div>
    </div>
  )
}

export default OtpSection
