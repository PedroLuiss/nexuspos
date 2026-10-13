import React, { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  width?: string
  className?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  width = 'max-w-md',
  className = ''
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Acrylic Backdrop Layer */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container (Stitch WinUI 3 Layer 400 Elevation) */}
      <div
        className={`relative bg-white w-full ${width} rounded-sm shadow-2xl border border-[#D1D1D1] flex flex-col overflow-hidden text-[#1B1B1B] font-sans ${className}`}
        role="dialog"
      >
        {/* Header (WinUI Fluent Header 48px) */}
        <div className="px-4 h-12 flex items-center justify-between border-b border-[#E5E5E5] bg-[#F9F9F9] rounded-t-sm select-none">
          <div className="flex items-center gap-2">
            {icon && <span className="text-[#0067C0]">{icon}</span>}
            <h3 className="font-semibold text-sm text-[#1B1B1B] tracking-tight">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="kbd-badge text-[10px] text-[#717783] bg-[#EBEBEB] px-1.5 py-0.5 rounded border border-[#D1D1D1] font-mono">
              ESC
            </span>
            <button
              onClick={onClose}
              className="text-[#717783] hover:text-[#C42B1C] hover:bg-[#F3F3F3] p-1 rounded transition-colors cursor-pointer focus:outline-none"
              aria-label="Cerrar modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body (Dense & Scrollable) */}
        <div className="p-4 overflow-y-auto max-h-[75vh] text-xs leading-relaxed">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="px-4 py-3 flex items-center justify-end gap-2 border-t border-[#E5E5E5] bg-[#F9F9F9] rounded-b-sm">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
