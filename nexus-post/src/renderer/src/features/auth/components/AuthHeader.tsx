import React from 'react'
import { Store, Minus, Square, X } from '../../../shared/icons/Icons'

export const AuthHeader: React.FC = () => {
  const handleMinimize = (): void => {
    // Si corre en Electron y contextBridge expone window.electron
    // de lo contrario silencioso
  }

  const handleMaximize = (): void => {}

  const handleClose = (): void => {}

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-[#E5E5E5] shadow-[0_1px_4px_rgba(0,0,0,0.03)] select-none">
      <div className="h-11 w-full px-3 flex items-center justify-between">
        {/* App Title & Identity */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#0067C0] flex items-center justify-center text-white shadow-xs">
            <Store size={14} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs tracking-tight text-[#1B1B1B]">NexusPOS</span>
            <span className="text-[#717783] text-[11px] opacity-75">Desktop Enterprise</span>
          </div>
        </div>

        {/* Windows 11 Titlebar Controls */}
        <div className="flex items-center -mr-3">
          <button
            type="button"
            aria-label="Minimizar"
            onClick={handleMinimize}
            className="h-11 w-11 flex items-center justify-center text-[#5C5C5C] hover:bg-[#E8E8E8] hover:text-[#1B1B1B] transition-colors"
          >
            <Minus size={13} />
          </button>
          <button
            type="button"
            aria-label="Maximizar"
            onClick={handleMaximize}
            className="h-11 w-11 flex items-center justify-center text-[#5C5C5C] hover:bg-[#E8E8E8] hover:text-[#1B1B1B] transition-colors"
          >
            <Square size={11} />
          </button>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={handleClose}
            className="h-11 w-11 flex items-center justify-center text-[#5C5C5C] hover:bg-[#C42B1C] hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default AuthHeader
