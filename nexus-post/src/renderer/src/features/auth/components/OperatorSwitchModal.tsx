import React, { useCallback, useEffect, useState } from 'react'
import type { User } from '@shared/contracts'
import { AlertCircle, KeyRound, Lock, RefreshCw, ShieldCheck, X } from '../../../shared/icons/Icons'
import { loginPinApi } from '../api/auth.api'

interface OperatorSwitchModalProps {
  isOpen: boolean
  currentUser: User | null
  onClose: () => void
  onSuccess: (user: User) => void
}

interface PinLockDialogProps {
  currentUser: User | null
  onClose: () => void
  onSuccess: (user: User) => void
}

const PIN_LENGTH = 4
const KEYPAD = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const

/**
 * Candado de estación (LOCK): valida el PIN contra la base de usuarios local
 * (`auth:loginWithPin`) y permite desbloquear o cambiar de operador en caliente.
 * El diálogo se monta sólo cuando está abierto, así el PIN arranca siempre limpio.
 */
export function OperatorSwitchModal({
  isOpen,
  currentUser,
  onClose,
  onSuccess
}: OperatorSwitchModalProps): React.JSX.Element | null {
  if (!isOpen) return null

  return <PinLockDialog currentUser={currentUser} onClose={onClose} onSuccess={onSuccess} />
}

function PinLockDialog({
  currentUser,
  onClose,
  onSuccess
}: PinLockDialogProps): React.JSX.Element {
  const [pin, setPin] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const station = currentUser?.station ?? 'CAJA-01'

  const submitPin = useCallback(
    async (value: string): Promise<void> => {
      if (value.length !== PIN_LENGTH || isValidating) return
      setIsValidating(true)
      setErrorMsg('')
      try {
        const response = await loginPinApi({ pin: value, station })
        if (response.success && response.user) {
          onSuccess(response.user)
          onClose()
          return
        }
        setErrorMsg(response.error || 'PIN no reconocido. Intente nuevamente.')
      } catch (error: unknown) {
        setErrorMsg(error instanceof Error ? error.message : 'No se pudo validar el PIN.')
      } finally {
        setIsValidating(false)
        setPin('')
      }
    },
    [isValidating, onClose, onSuccess, station]
  )

  const appendDigit = useCallback(
    (digit: string): void => {
      if (isValidating) return
      setErrorMsg('')
      setPin((prev) => {
        if (prev.length >= PIN_LENGTH) return prev
        const next = prev + digit
        if (next.length === PIN_LENGTH) void submitPin(next)
        return next
      })
    },
    [isValidating, submitPin]
  )

  const removeDigit = useCallback((): void => {
    setErrorMsg('')
    setPin((prev) => prev.slice(0, -1))
  }, [])

  const clearPin = useCallback((): void => {
    setErrorMsg('')
    setPin('')
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === 'Backspace') {
        event.preventDefault()
        removeDigit()
        return
      }
      if (event.key >= '0' && event.key <= '9') {
        event.preventDefault()
        appendDigit(event.key)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [appendDigit, onClose, removeDigit])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm animate-backdrop">
      <div className="w-full max-w-sm overflow-hidden rounded-[8px] border border-[#D1D1D1] bg-white shadow-[0_16px_32px_rgba(0,0,0,0.18)] animate-modal flex flex-col select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E5E5] bg-[#F9F9F9] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#0067C0] text-white shadow-xs">
              <Lock size={15} />
            </div>
            <div>
              <h2 className="text-xs font-extrabold tracking-tight text-[#1B1B1B]">
                Estación bloqueada
              </h2>
              <p className="text-[11px] text-[#717783]">
                Operador actual:{' '}
                <span className="font-semibold text-[#0067C0]">
                  {currentUser?.name ?? 'Sin sesión'}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar candado"
            className="rounded p-1 text-[#717783] transition-colors hover:bg-[#F3F3F3] hover:text-[#C42B1C] cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-3 p-4">
          <p className="text-[11px] font-medium text-[#5C5C5C]">
            Ingrese el PIN de 4 dígitos para volver a la caja o asumir el turno con otro operador.
          </p>

          {/* PIN dots */}
          <div className="flex items-center justify-center gap-3 rounded-[6px] border border-[#D1D1D1] bg-[#F9F9F9] py-3.5">
            {Array.from({ length: PIN_LENGTH }).map((_, index) => {
              const isFilled = index < pin.length
              return (
                <span
                  key={index}
                  className={`h-3.5 w-3.5 rounded-full transition-all duration-150 ${
                    isFilled ? 'scale-110 bg-[#0067C0] shadow-xs' : 'bg-[#D1D5DB]'
                  }`}
                />
              )
            })}
          </div>

          {errorMsg && (
            <p className="flex items-center justify-center gap-1 text-[11px] font-semibold text-[#C42B1C]">
              <AlertCircle size={13} />
              <span>{errorMsg}</span>
            </p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-1.5">
            {KEYPAD.map((digit) => (
              <button
                key={digit}
                type="button"
                disabled={isValidating}
                onClick={() => appendDigit(digit)}
                className="h-10 rounded-[4px] border border-[#D1D1D1] bg-white font-mono text-sm font-bold text-[#1B1B1B] shadow-xs transition-colors hover:bg-[#F9F9F9] active:scale-95 active:bg-[#E8F0FA] disabled:opacity-50 cursor-pointer"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              onClick={clearPin}
              className="h-10 rounded-[4px] border border-red-200 bg-red-50 text-[11px] font-bold text-[#C42B1C] transition-colors hover:bg-red-100 cursor-pointer"
            >
              BORRAR
            </button>
            <button
              type="button"
              disabled={isValidating}
              onClick={() => appendDigit('0')}
              className="h-10 rounded-[4px] border border-[#D1D1D1] bg-white font-mono text-sm font-bold text-[#1B1B1B] shadow-xs transition-colors hover:bg-[#F9F9F9] active:scale-95 active:bg-[#E8F0FA] disabled:opacity-50 cursor-pointer"
            >
              0
            </button>
            <button
              type="button"
              onClick={removeDigit}
              className="h-10 rounded-[4px] border border-[#D1D1D1] bg-[#F3F3F3] text-[11px] font-bold text-[#5C5C5C] transition-colors hover:bg-[#E8E8E8] cursor-pointer"
            >
              ←
            </button>
          </div>

          {isValidating && (
            <p className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#0067C0]">
              <RefreshCw size={13} className="animate-spin" />
              <span>Validando PIN contra la base local…</span>
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#E5E5E5] bg-[#F8F9FA] px-4 py-2 text-[10px] font-medium text-[#717783]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={12} className="text-[#107C41]" />
            Sesión protegida
          </span>
          <span className="flex items-center gap-1.5">
            <KeyRound size={12} />
            <span className="kbd-badge text-[9px]">ESC</span> Cancelar
          </span>
        </div>
      </div>
    </div>
  )
}

export default OperatorSwitchModal
