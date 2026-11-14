import React, { useState, useEffect } from 'react'
import { KeyRound, X } from '../../../shared/icons/Icons'

interface QuickPinModalProps {
  isOpen: boolean
  isLoading: boolean
  onClose: () => void
  onSubmitPin: (pin: string) => void
}

export const QuickPinModal: React.FC<QuickPinModalProps> = ({
  isOpen,
  isLoading,
  onClose,
  onSubmitPin
}) => {
  const [pin, setPin] = useState('')

  useEffect(() => {
    if (isOpen) {
      setPin('')
    }
  }, [isOpen])

  // Support numeric keyboard typing directly
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault()
        if (pin.length < 4) {
          const next = pin + e.key
          setPin(next)
          if (next.length === 4) {
            setTimeout(() => onSubmitPin(next), 120)
          }
        }
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        setPin((prev) => prev.slice(0, -1))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, pin, onSubmitPin])

  if (!isOpen) return null

  const handleDigit = (digit: string): void => {
    if (pin.length < 4) {
      const next = pin + digit
      setPin(next)
      if (next.length === 4) {
        setTimeout(() => onSubmitPin(next), 120)
      }
    }
  }

  const handleClear = (): void => setPin('')

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-backdrop">
      <div className="w-full max-w-xs rounded-xl bg-white shadow-2xl p-5 flex flex-col gap-4 animate-modal border border-[#E5E5E5]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#EFF6FC] flex items-center justify-center text-[#0067C0]">
              <KeyRound size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#1B1B1B]">Acceso Rápido con PIN</h2>
              <p className="text-[11px] text-[#717783]">Código de cajero (4 dígitos)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#717783] hover:bg-[#F3F3F3] hover:text-[#1B1B1B] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* PIN Display Dots */}
        <div className="h-12 rounded-lg bg-[#F3F3F3] flex items-center justify-center gap-3 border border-[#E5E5E5]">
          {[1, 2, 3, 4].map((index) => {
            const isFilled = index <= pin.length
            return (
              <span
                key={index}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-150 ${
                  isFilled ? 'bg-[#0067C0] scale-110 shadow-xs' : 'bg-[#D1D5DB]'
                }`}
              />
            )
          })}
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isLoading}
              onClick={() => handleDigit(digit)}
              className="h-11 rounded-lg bg-[#F3F3F3] hover:bg-[#E8E8E8] active:bg-[#D5E3FF] font-mono text-base font-bold text-[#1B1B1B] transition-colors shadow-2xs border border-[#E5E5E5] cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-11 rounded-lg bg-[#E8E8E8] hover:bg-[#D1D5DB] text-[#5C5C5C] text-xs font-semibold tracking-wider transition-colors cursor-pointer"
          >
            BORRAR
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => handleDigit('0')}
            className="h-11 rounded-lg bg-[#F3F3F3] hover:bg-[#E8E8E8] active:bg-[#D5E3FF] font-mono text-base font-bold text-[#1B1B1B] transition-colors shadow-2xs border border-[#E5E5E5] cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-lg bg-[#E8E8E8] hover:bg-[#D1D5DB] text-[#5C5C5C] text-xs font-semibold tracking-wider transition-colors cursor-pointer"
          >
            ESC
          </button>
        </div>

        <div className="text-center font-mono text-[11px] text-[#717783] pt-1">
          Operador por defecto: <span className="font-semibold text-[#1B1B1B]">CAJA-01</span>
        </div>
      </div>
    </div>
  )
}

export default QuickPinModal
