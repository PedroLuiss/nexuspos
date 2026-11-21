import { useCallback, useRef, useState } from 'react'

export type ToastType = 'success' | 'info' | 'error'

export interface ToastMessage {
  id: number
  message: string
  type: ToastType
}

export interface UseToastReturn {
  toast: ToastMessage | null
  showToast: (message: string, type?: ToastType) => void
  dismissToast: () => void
}

/**
 * Estado transversal de alertas efímeras (toasts) del renderer.
 * La animación de entrada, el auto-cierre y la animación de salida viven en
 * `shared/ui/ToastAlert.tsx`; este hook sólo administra el mensaje vigente.
 */
export function useToast(): UseToastReturn {
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const nextId = useRef(0)

  const showToast = useCallback((message: string, type: ToastType = 'success'): void => {
    nextId.current += 1
    setToast({ id: nextId.current, message, type })
  }, [])

  const dismissToast = useCallback((): void => {
    setToast(null)
  }, [])

  return { toast, showToast, dismissToast }
}

export default useToast
