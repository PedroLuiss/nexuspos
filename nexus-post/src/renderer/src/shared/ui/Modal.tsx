import React, { ReactNode, useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: string
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,
  width = 'max-w-md'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop">
      {/* Acrylic Backdrop Layer */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container (Stitch Layer 400 Elevation) */}
      <div 
        className={`relative bg-white w-full ${width} rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] flex flex-col overflow-hidden animate-modal`}
        role="dialog"
      >
        {/* Header (WinUI Fluent Header 48px) */}
        <div className="px-4 h-12 flex items-center justify-between border-b border-[#E5E5E5] bg-[#F9F9F9] rounded-t-[8px] select-none">
          <h3 className="font-extrabold text-sm text-[#1B1B1B] tracking-tight">{title}</h3>
          <div className="flex items-center gap-2">
            <span className="kbd-badge text-[10px] text-[#717783]">ESC</span>
            <button 
              onClick={onClose}
              className="text-[#717783] hover:text-[#C42B1C] hover:bg-[#F3F3F3] p-1 rounded transition-colors cursor-pointer"
              aria-label="Cerrar modal"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Body (Dense & Scrollable) */}
        <div className="p-4 overflow-y-auto max-h-[80vh] text-[#1B1B1B]">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="px-4 py-2.5 flex items-center justify-end gap-2.5 border-t border-[#E5E5E5] bg-[#F9F9F9] rounded-b-[8px]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
