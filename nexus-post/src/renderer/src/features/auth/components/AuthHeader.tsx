import React from 'react'
import { Minus, Square, X } from '../../../shared/icons/Icons'
import logoBanner from '@resources/logobanner.png'

export const AuthHeader: React.FC = () => {
  const handleMinimize = (): void => {
    void window.api?.appWindow?.minimize()
  }

  const handleMaximize = (): void => {
    void window.api?.appWindow?.toggleMaximize()
  }

  const handleClose = (): void => {
    void window.api?.appWindow?.close()
  }

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-[#E5E5E5] shadow-[0_1px_4px_rgba(0,0,0,0.03)] select-none">
      <div className="h-11 w-full px-3 flex items-center justify-between">
        {/* App Title & Identity */}
        <div className="flex items-center">
          <img
            src={logoBanner}
            alt="NexusPOS — Diseñado para crecer contigo"
            draggable={false}
            className="h-7 w-auto max-w-[180px] object-contain"
          />
        </div>

        {/* Windows 11 Titlebar Controls */}
        <div className="flex items-center -mr-3">
          <button
            type="button"
            aria-label="Minimizar"
            onClick={handleMinimize}
            className="h-11 w-11 flex items-center justify-center text-[#5C5C5C] hover:bg-[#E8E8E8] hover:text-[#1B1B1B] transition-colors cursor-pointer"
          >
            <Minus size={13} />
          </button>
          <button
            type="button"
            aria-label="Maximizar"
            onClick={handleMaximize}
            className="h-11 w-11 flex items-center justify-center text-[#5C5C5C] hover:bg-[#E8E8E8] hover:text-[#1B1B1B] transition-colors cursor-pointer"
          >
            <Square size={11} />
          </button>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={handleClose}
            className="h-11 w-11 flex items-center justify-center text-[#5C5C5C] hover:bg-[#C42B1C] hover:text-white transition-colors cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default AuthHeader
