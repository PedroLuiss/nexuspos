import React, { useState } from 'react'
import {
  ShieldCheck,
  Mail,
  Key,
  Info,
  Clock,
  ArrowRight,
  Headphones,
  CheckCircle2,
  X
} from '../../../shared/icons/Icons'

interface ForgotPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onCodeSent?: (email: string) => void
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onCodeSent
}) => {
  const [email, setEmail] = useState('cajero.central@novuspos.pe')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!email) return
    onCodeSent?.(email.trim())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-backdrop">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl p-6 flex flex-col gap-4 animate-modal border border-[#E5E5E5]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#F3F3F3] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#EFF6FC] flex items-center justify-center text-[#0067C0]">
              <Key size={16} />
            </div>
            <div>
              <span className="font-mono text-[10px] text-[#0067C0] uppercase font-bold tracking-wider">
                Seguridad TI
              </span>
              <h2 className="text-sm font-bold text-[#1B1B1B]">Recuperar Contraseña</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#717783] hover:bg-[#F3F3F3] hover:text-[#1B1B1B] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <p className="text-xs text-[#5C5C5C]">
            Ingrese el correo electrónico corporativo registrado para recibir el token de recuperación temporal de un solo uso (OTP).
          </p>

            <div className="flex flex-col gap-1">
              <label htmlFor="corpEmail" className="text-xs font-semibold text-[#1B1B1B]">
                Correo Electrónico Corporativo
              </label>
              <div className="relative flex items-center">
                <Mail size={16} className="absolute left-3 text-[#717783] pointer-events-none" />
                <input
                  id="corpEmail"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo: operador@novuspos.pe"
                  className="w-full h-10 pl-9 pr-3 rounded-md bg-[#F3F3F3] text-xs text-[#1B1B1B] placeholder:text-[#888] focus:bg-white focus:shadow-[0_0_0_2px_#0067C0] border border-transparent outline-none"
                />
              </div>
            </div>

            {/* Security Protocol Card */}
            <div className="bg-[#F8F9FA] border border-[#E9ECEF] rounded-md p-3 flex flex-col gap-1.5 text-xs text-[#5C5C5C]">
              <div className="flex items-center gap-1.5 text-[#107C41] font-semibold">
                <ShieldCheck size={16} />
                <span>Protocolo de Entrega Cifrado</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Protegido por token de un solo uso (OTP). Expira automáticamente en 10 minutos.
              </p>
              <div className="flex items-center gap-1 text-[11px] text-[#717783] pt-1">
                <Clock size={13} className="text-[#C42B1C]" />
                <span>Válido para estaciones autorizadas de NovusPOS.</span>
              </div>
            </div>

            {/* Support Helpdesk footer */}
            <div className="flex items-center gap-2 text-[11px] text-[#717783] bg-[#EFF6FC] p-2.5 rounded-md text-[#0067C0]">
              <Headphones size={15} className="shrink-0" />
              <span>¿Sin acceso a correo? Contacte a Mesa de Ayuda TI: <strong>Anexo 4001</strong></span>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-md bg-[#F3F3F3] hover:bg-[#E8E8E8] text-xs font-semibold text-[#1B1B1B] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-9 px-4 rounded-md bg-[#0067C0] hover:bg-[#0078D4] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <span>Enviar Código</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        </div>
      </div>
  )
}

export default ForgotPasswordModal
