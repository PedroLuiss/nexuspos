import React, { useState, useEffect, useRef } from 'react'
import {
  ShieldCheck,
  Key,
  ArrowLeft,
  Timer,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from '../../../shared/icons/Icons'

interface VerifyOtpViewProps {
  email: string
  isLoading: boolean
  onBackToLogin: () => void
  onOtpVerified: (code: string) => void
  onResendOtp: () => void
}

export const VerifyOtpView: React.FC<VerifyOtpViewProps> = ({
  email,
  isLoading,
  onBackToLogin,
  onOtpVerified,
  onResendOtp
}) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', ''])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes in seconds
  const [resendCooldown, setResendCooldown] = useState(45)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer
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
    const newDigits = [...digits]
    newDigits[index] = char
    setDigits(newDigits)
    setErrorMessage(null)

    // Move to next input if digit typed
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto verify if all 6 digits entered
    if (char && index === 5 && newDigits.every((d) => d !== '')) {
      const fullCode = newDigits.join('')
      onOtpVerified(fullCode)
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'Escape') {
      onBackToLogin()
    }
  }

  const handlePaste = (e: React.ClipboardEvent): void => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const newDigits = pasted.split('')
      setDigits(newDigits)
      onOtpVerified(pasted)
    }
  }

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    const fullCode = digits.join('')
    if (fullCode.length !== 6) {
      setErrorMessage('Ingrese los 6 dígitos del código de verificación.')
      return
    }
    onOtpVerified(fullCode)
  }

  return (
    <div className="w-full max-w-[580px] bg-white/95 backdrop-blur-2xl rounded-xl shadow-xl flex flex-col overflow-hidden border border-[#E5E5E5] animate-modal">
      {/* Top Gradient Ribbon Accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0067C0] via-[#0078D4] to-[#107C41]" />

      <div className="p-6 flex flex-col gap-4">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-[#F3F3F3] pb-3">
          <button
            type="button"
            onClick={onBackToLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F3F3F3] hover:bg-[#E8E8E8] text-[#1B1B1B] text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} className="text-[#0067C0]" />
            <span>Volver al Login</span>
            <span className="font-mono text-[10px] bg-[#E8E8E8] text-[#5C5C5C] px-1 rounded ml-1">
              ESC
            </span>
          </button>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#107C41] font-mono text-[11px] font-semibold border border-[#C8E6C9]">
            <span className="w-2 h-2 rounded-full bg-[#107C41] animate-pulse" />
            <span>CANAL CIFRADO RSA-4096</span>
          </div>
        </div>

        {/* Title & Sent Email Indicator */}
        <div className="flex flex-col items-center text-center gap-1">
          <div className="w-12 h-12 rounded-xl bg-[#EFF6FC] text-[#0067C0] flex items-center justify-center shadow-xs mb-1">
            <Key size={24} />
          </div>
          <span className="font-mono text-[10px] text-[#0067C0] uppercase font-bold tracking-wider">
            Paso 1 de 2 • Verificación de Identidad
          </span>
          <h2 className="text-lg font-bold text-[#1B1B1B]">Código de Autorización OTP</h2>
          <p className="text-xs text-[#5C5C5C] max-w-md">
            Hemos enviado un código numérico temporal de 6 dígitos a:
          </p>
          <span className="font-mono text-xs font-bold text-[#0067C0] bg-[#EFF6FC] border border-[#0067C0]/20 px-3 py-1 rounded-md mt-0.5">
            {email || 'cajero.central@nexuspos.pe'}
          </span>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="flex items-start gap-2 p-3 bg-[#FDE8E8] border border-[#F5C2C7] rounded-md text-[#C42B1C] text-xs animate-modal">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div className="font-medium">{errorMessage}</div>
          </div>
        )}

        {/* 6 Digit Boxes */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-2 pt-2" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <React.Fragment key={idx}>
                {idx === 3 && (
                  <span className="font-mono font-bold text-lg text-[#717783] px-1 select-none">
                    -
                  </span>
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
                  autoFocus={idx === 0}
                  className="w-12 h-14 text-center font-mono text-2xl font-bold text-[#1B1B1B] bg-[#F3F3F3] focus:bg-white rounded-lg border border-[#D1D5DB] focus:border-transparent focus:shadow-[0_0_0_2px_#0067C0] outline-none transition-all shadow-xs"
                />
              </React.Fragment>
            ))}
          </div>

          {/* Expiration Timer Card */}
          <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-lg p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-[#5C5C5C]">
              <span className="flex items-center gap-1.5 font-medium">
                <Timer size={15} className="text-[#C42B1C]" />
                Expiración del token:
              </span>
              <span className="font-mono font-bold text-xs bg-white px-2 py-0.5 rounded border border-[#E5E5E5] text-[#1B1B1B]">
                {formatTimer(timeLeft)}
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-[#E5E5E5] h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#0067C0] h-full transition-all duration-1000"
                style={{ width: `${(timeLeft / 600) * 100}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-[#717783]">¿No recibió el correo?</span>
              <button
                type="button"
                disabled={resendCooldown > 0}
                onClick={() => {
                  onResendOtp()
                  setResendCooldown(45)
                }}
                className="font-semibold text-[#0067C0] disabled:text-[#888] disabled:cursor-not-allowed hover:underline text-xs cursor-pointer"
              >
                {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : 'Reenviar código OTP'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onBackToLogin}
              className="h-10 px-4 rounded-md bg-[#F3F3F3] hover:bg-[#E8E8E8] text-xs font-semibold text-[#1B1B1B] transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || digits.some((d) => d === '')}
              className="h-10 px-5 rounded-md bg-[#0067C0] hover:bg-[#0078D4] text-white text-xs font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? 'Verificando...' : 'Continuar a Nueva Clave'}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </form>
      </div>

      {/* Card Footer */}
      <div className="px-6 py-2.5 bg-[#F8F9FA] border-t border-[#E5E5E5] flex items-center justify-between text-[11px] text-[#717783] select-none font-mono">
        <span>Active Directory Security • NexusPOS</span>
        <span>Código demo: 849215</span>
      </div>
    </div>
  )
}

export default VerifyOtpView
