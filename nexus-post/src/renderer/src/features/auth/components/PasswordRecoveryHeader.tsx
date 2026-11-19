import React from 'react'
import { ArrowLeft, ShieldCheck } from '../../../shared/icons/Icons'

interface PasswordRecoveryHeaderProps {
  email: string
  onBackToLogin: () => void
}

export function PasswordRecoveryHeader({
  email,
  onBackToLogin
}: PasswordRecoveryHeaderProps): React.JSX.Element {
  return (
    <header className="flex items-center justify-between border-b border-[#E5E5E5] bg-[#F8F9FA] p-4">
      <div>
        <div className="flex items-center gap-2 text-[#0067C0]">
          <ShieldCheck size={18} />
          <span className="text-[10px] font-bold uppercase tracking-wider">
            Recuperación segura
          </span>
        </div>
        <h1 className="mt-1 text-lg font-bold text-[#1B1B1B]">
          Verifique el código y cambie su contraseña
        </h1>
        <p className="mt-1 text-xs text-[#5C5C5C]">
          Código solicitado para <span className="font-mono font-semibold">{email}</span>
        </p>
      </div>
      <button
        type="button"
        onClick={onBackToLogin}
        className="flex items-center gap-1.5 rounded border border-[#D1D1D1] bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50"
      >
        <ArrowLeft size={14} />
        Volver
      </button>
    </header>
  )
}
