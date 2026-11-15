import React, { useState } from 'react'
import type { LoginInput } from '@shared/contracts'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  KeyRound,
  Radio,
  AlertCircle
} from '../../../shared/icons/Icons'

interface LoginFormProps {
  isLoading: boolean
  errorMessage: string | null
  onSubmit: (credentials: LoginInput) => void
  onOpenPinModal: () => void
  onOpenForgotModal: () => void
  onRfidClick: () => void
}

export const LoginForm: React.FC<LoginFormProps> = ({
  isLoading,
  errorMessage,
  onSubmit,
  onOpenPinModal,
  onOpenForgotModal,
  onRfidClick
}) => {
  const [emailOrUsername, setEmailOrUsername] = useState('cajero.central@nexuspos.pe')
  const [password, setPassword] = useState('SecurityKey#2026')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberStation, setRememberStation] = useState(true)

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    onSubmit({
      emailOrUsername: emailOrUsername.trim(),
      password,
      station: 'CAJA-01',
      rememberStation
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Error Alert if any */}
      {errorMessage && (
        <div className="flex items-start gap-2 p-3 bg-[#FDE8E8] border border-[#F5C2C7] rounded-md text-[#C42B1C] text-xs animate-modal">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="font-medium leading-relaxed">{errorMessage}</div>
        </div>
      )}

      {/* Main Credentials Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {/* Username / Corporate Email Field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="emailInput"
            className="text-xs font-semibold text-[#1B1B1B] flex items-center justify-between"
          >
            <span>Correo Electrónico o Usuario de Dominio</span>
            <span className="font-mono text-[10px] text-[#5C5C5C] bg-[#E8E8E8] px-1.5 py-0.5 rounded">
              ID: DOM-01
            </span>
          </label>
          <div className="relative flex items-center">
            <Mail size={16} className="absolute left-3 text-[#717783] pointer-events-none" />
            <input
              id="emailInput"
              type="text"
              required
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              placeholder="ejemplo: cajero@nexuspos.pe"
              className="w-full h-10 pl-9 pr-3 rounded-md bg-[#F3F3F3] text-xs text-[#1B1B1B] placeholder:text-[#888] focus:bg-white focus:shadow-[0_0_0_2px_#0067C0] border border-transparent focus:border-transparent outline-none transition-all"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="passwordInput" className="text-xs font-semibold text-[#1B1B1B]">
              Contraseña de Acceso
            </label>
            <button
              type="button"
              onClick={onOpenForgotModal}
              className="text-xs text-[#0067C0] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>¿Olvidó su contraseña?</span>
              <span className="font-mono text-[10px] bg-[#E8E8E8] text-[#5C5C5C] px-1 rounded">
                F1
              </span>
            </button>
          </div>
          <div className="relative flex items-center">
            <Lock size={16} className="absolute left-3 text-[#717783] pointer-events-none" />
            <input
              id="passwordInput"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full h-10 pl-9 pr-10 rounded-md bg-[#F3F3F3] text-xs text-[#1B1B1B] placeholder:text-[#888] focus:bg-white focus:shadow-[0_0_0_2px_#0067C0] border border-transparent focus:border-transparent outline-none transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              className="absolute right-2.5 h-6 w-6 flex items-center justify-center text-[#717783] hover:text-[#1B1B1B] transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Remember Workstation Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer pt-0.5 select-none group">
          <input
            type="checkbox"
            checked={rememberStation}
            onChange={(e) => setRememberStation(e.target.checked)}
            className="w-4 h-4 rounded text-[#0067C0] accent-[#0067C0] cursor-pointer"
          />
          <span className="text-xs text-[#5C5C5C] group-hover:text-[#1B1B1B] transition-colors">
            Recordar estación de trabajo (
            <span className="font-mono font-semibold text-[#1B1B1B]">CAJA-01</span>)
          </span>
        </label>

        {/* Primary Action Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="mt-2 h-11 w-full rounded-md bg-[#0067C0] hover:bg-[#0078D4] active:bg-[#005A9E] text-white font-semibold text-xs flex items-center justify-between px-4 shadow-sm transition-all disabled:opacity-60 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <LogIn size={18} />
            <span>{isLoading ? 'Verificando credenciales...' : 'Iniciar Sesión'}</span>
          </span>
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/20 text-white font-bold">
            ENTER
          </span>
        </button>
      </form>

      {/* Visual Divider */}
      <div className="relative flex items-center py-1">
        <div className="flex-grow h-px bg-[#E5E5E5]"></div>
        <span className="shrink-0 mx-2 font-mono text-[10px] text-[#717783] uppercase tracking-wider bg-white px-2">
          O acceder con método rápido
        </span>
        <div className="flex-grow h-px bg-[#E5E5E5]"></div>
      </div>

      {/* Alternative Quick Methods: PIN & RFID */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onOpenPinModal}
          className="h-11 px-3 rounded-md bg-[#F3F3F3] hover:bg-[#E8E8E8] text-[#1B1B1B] flex items-center justify-between transition-colors shadow-2xs border border-[#E5E5E5] cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded bg-white flex items-center justify-center text-[#0067C0] shadow-2xs">
              <KeyRound size={14} />
            </div>
            <span className="text-xs font-semibold">PIN Numérico</span>
          </div>
          <span className="font-mono text-[10px] bg-[#E8E8E8] text-[#5C5C5C] px-1.5 py-0.5 rounded">
            F10
          </span>
        </button>

        <button
          type="button"
          onClick={onRfidClick}
          className="h-11 px-3 rounded-md bg-[#F3F3F3] hover:bg-[#E8E8E8] text-[#1B1B1B] flex items-center justify-between transition-colors shadow-2xs border border-[#E5E5E5] cursor-pointer"
        >
          <div className="flex items-center gap-2 truncate">
            <div className="w-6 h-6 rounded bg-white flex items-center justify-center text-[#107C41] shadow-2xs">
              <Radio size={14} />
            </div>
            <span className="text-xs font-semibold">Tarjeta RFID</span>
          </div>
          <span className="font-mono text-[10px] bg-[#E8E8E8] text-[#5C5C5C] px-1.5 py-0.5 rounded">
            NFC
          </span>
        </button>
      </div>
    </div>
  )
}

export default LoginForm
