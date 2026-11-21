import React, { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Key,
  Timer,
  ShieldCheck,
  Headphones,
  Info
} from '../../../shared/icons/Icons'

interface ForgotPasswordViewProps {
  onBackToLogin: () => void
  onCodeSent: (email: string) => Promise<boolean>
  isLoading?: boolean
}

export const ForgotPasswordView: React.FC<ForgotPasswordViewProps> = ({
  onBackToLogin,
  onCodeSent,
  isLoading = false
}) => {
  const [email, setEmail] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!email.trim()) return
    setErrorMessage(null)
    try {
      const sent = await onCodeSent(email.trim())
      setCodeSent(sent)
      if (!sent)
        setErrorMessage('No se pudo enviar el código. Revise la conexión e intente nuevamente.')
    } catch (error) {
      setCodeSent(false)
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo enviar el código.')
    }
  }

  return (
    <div className="relative w-full min-h-[calc(100vh-6rem)] flex items-center justify-center p-4 animate-modal">
      {/* Ambient accent lights (Stitch DNA) */}
      <div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-[#D5E3FF]/40 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-28 -right-16 w-80 h-80 rounded-full bg-[#E8F5E9]/30 blur-3xl pointer-events-none" />

      {/* ── Fluent Acrylic Window Card (max-w-620px) ── */}
      <section className="relative w-full max-w-[620px] bg-white/90 backdrop-blur-2xl rounded-xl shadow-xl overflow-hidden flex flex-col border border-[#E5E5E5]">
        {/* Top Fluent Mica Gradient Edge */}
        <div className="h-1 w-full bg-gradient-to-r from-[#0067C0]/10 via-[#0067C0] to-[#0067C0]/10" />

        {/* Navigation & Session Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToLogin}
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F3F3] hover:bg-[#E8E8E8] transition-all text-[#1B1B1B] cursor-pointer"
          >
            <ArrowLeft
              size={16}
              className="text-[#0067C0] group-hover:-translate-x-0.5 transition-transform"
            />
            <span className="text-xs font-semibold">Volver al Inicio de Sesión</span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#E5E5E5] text-[#717783] ml-1">
              ESC
            </span>
          </button>
        </div>

        {/* Core Content */}
        <div className="px-6 pt-2 pb-6 flex flex-col gap-5">
          {/* Visual Identity — Shield + Lock icon */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="relative w-16 h-16 rounded-full bg-[#D5E3FF] flex items-center justify-center text-[#0067C0] shadow-md mb-1">
              <ShieldCheck size={32} />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center text-[#107C41]">
                <Key size={14} />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-[#1B1B1B] tracking-tight">
              Recuperar Contraseña de Acceso
            </h1>
            <p className="text-sm text-[#5C5C5C] max-w-[460px]">
              Ingrese el correo asociado a su cuenta. El servicio de autenticación enviará un código
              de 6 dígitos si la recuperación está disponible.
            </p>
          </div>

          {/* Email Form */}
          <form onSubmit={(event) => void handleSubmit(event)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="corpEmailFull"
                  className="text-sm font-semibold text-[#1B1B1B] flex items-center gap-1"
                >
                  Correo Electrónico Registrado
                  <span className="text-[#C42B1C]">*</span>
                </label>
              </div>

              {/* Fluent Input with active bottom bar */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#717783] group-focus-within:text-[#0067C0] transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  id="corpEmailFull"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  disabled={isLoading}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setCodeSent(false)
                    setErrorMessage(null)
                  }}
                  placeholder="novuspos@gmail.com"
                  className="w-full h-11 pl-10 rounded-lg bg-[#F3F3F3] text-sm text-[#1B1B1B] placeholder:text-[#A0A0A0] focus:bg-white focus:outline-none shadow-sm transition-all"
                />
              </div>

              <p className="text-xs text-[#5C5C5C] flex items-center gap-1 mt-0.5">
                <Info size={13} className="text-[#0067C0] flex-shrink-0" />
                El correo debe coincidir con el registrado en el padrón de usuarios de la tienda.
              </p>
            </div>

            {/* Security Protocol Card */}
            <div className="bg-[#F8F9FA] rounded-lg p-3.5 flex flex-col gap-2 shadow-sm border border-[#E9ECEF]">
              <div className="flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-[#107C41] mt-0.5 flex-shrink-0" />
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-[#1B1B1B]">
                    Protocolo de Entrega Cifrado
                  </span>
                  <span className="text-[11px] text-[#5C5C5C] mt-0.5">
                    La recuperación usa un código de un solo uso validado por el servicio de
                    autenticación.
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[#E9ECEF]">
                <span className="text-[11px] text-[#5C5C5C] flex items-center gap-1.5">
                  <Timer size={14} className="text-[#C42B1C]" />
                  El código puede expirar según la política del servicio.
                </span>
                <span className="font-mono text-[10px] text-slate-500 font-semibold">OTP</span>
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-800"
              >
                {errorMessage}
              </div>
            )}

            {/* Success Toast (after sending) */}
            {codeSent && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9] text-[#107C41] animate-modal">
                <div className="w-5 h-5 rounded-full bg-[#107C41] text-white flex items-center justify-center flex-shrink-0">
                  <ShieldCheck size={12} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold">Código de autorización emitido</span>
                  <span className="text-[11px] opacity-80">
                    Revise su bandeja de entrada corporativa.
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={onBackToLogin}
                className="h-10 px-4 rounded-lg bg-[#F3F3F3] hover:bg-[#E8E8E8] text-[#1B1B1B] text-sm font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span className="font-mono text-[10px] bg-[#E8E8E8] text-[#5C5C5C] px-1.5 py-0.5 rounded">
                  ESC
                </span>
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="h-10 px-5 rounded-lg bg-[#0067C0] hover:bg-[#0078D4] active:scale-[0.98] text-white text-sm font-semibold transition-all flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
              >
                <span className="font-mono text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                  ENTER
                </span>
                <span>{isLoading ? 'Enviando...' : 'Enviar Código de Verificación'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>

        {/* Assistance & System Footer */}
        <div className="bg-[#F3F3F3] px-6 py-3.5 flex flex-col gap-1.5 border-t border-[#E5E5E5]">
          <div className="flex items-center gap-2 text-[#5C5C5C]">
            <Headphones size={15} className="text-[#717783] flex-shrink-0" />
            <p className="text-xs">
              ¿Sin acceso a su correo corporativo? Contacte a Mesa de Ayuda:{' '}
              <span className="font-semibold text-[#0067C0]">Soporte TI (Anexo 4001)</span>
            </p>
          </div>
          <div className="flex items-center justify-between text-[#717783] pt-0.5">
            <span className="font-mono text-[10px]">NovusPOS | Recuperación de acceso</span>
            <span className="font-mono text-[10px] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              SERVICIO EXTERNO
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ForgotPasswordView
