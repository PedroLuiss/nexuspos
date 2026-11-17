import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from '../icons/Icons'
import type { ToastMessage, ToastType } from '../hooks/useToast'

interface ToastAlertProps {
  toast: ToastMessage
  /** Tiempo visible antes de auto-cerrarse (ms). Debe coincidir con la barra de progreso. */
  duration?: number
  onDismiss: () => void
}

const EXIT_ANIMATION_MS = 180

const TYPE_STYLES: Record<ToastType, { icon: React.JSX.Element; accent: string; border: string }> = {
  success: {
    icon: <CheckCircle2 size={16} className="text-emerald-400" />,
    accent: 'bg-emerald-400',
    border: 'border-emerald-500/40'
  },
  info: {
    icon: <Info size={16} className="text-sky-400" />,
    accent: 'bg-sky-400',
    border: 'border-sky-500/40'
  },
  error: {
    icon: <AlertCircle size={16} className="text-red-400" />,
    accent: 'bg-red-400',
    border: 'border-red-500/40'
  }
}

/**
 * Alerta animada efímera (WinUI Fluent Toast). Presentacional: no contiene IPC
 * ni lógica de negocio; el mensaje llega desde `useToast`.
 */
export function ToastAlert({
  toast,
  duration = 3400,
  onDismiss
}: ToastAlertProps): React.JSX.Element {
  const [isLeaving, setIsLeaving] = useState(false)
  const style = TYPE_STYLES[toast.type]

  useEffect(() => {
    const hideTimer = window.setTimeout(() => setIsLeaving(true), duration)
    const closeTimer = window.setTimeout(onDismiss, duration + EXIT_ANIMATION_MS)
    return () => {
      window.clearTimeout(hideTimer)
      window.clearTimeout(closeTimer)
    }
  }, [toast.id, duration, onDismiss])

  const handleClose = (): void => {
    setIsLeaving(true)
    window.setTimeout(onDismiss, EXIT_ANIMATION_MS)
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-14 right-5 z-[60] flex items-center gap-2 overflow-hidden rounded-[6px] border ${style.border} bg-slate-900/95 px-3.5 py-2.5 text-xs text-white shadow-xl backdrop-blur-sm select-none ${
        isLeaving ? 'animate-toast-out' : 'animate-toast-in'
      }`}
    >
      {style.icon}
      <span className="max-w-[280px] font-semibold leading-snug">{toast.message}</span>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Cerrar alerta"
        className="ml-1.5 rounded-[3px] p-0.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
      >
        <X size={13} />
      </button>
      <span
        className={`toast-progress absolute bottom-0 left-0 h-[2px] w-full ${style.accent}`}
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  )
}

export default ToastAlert
