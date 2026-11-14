import { useState, useEffect, useCallback } from 'react'
import type { User, LoginInput } from '@shared/contracts'
import { loginApi, loginPinApi, logoutApi, getCurrentUserApi } from '../api/auth.api'

export interface UseAuthReturn {
  currentUser: User | null
  isAuthenticated: boolean
  isLoading: boolean
  errorMessage: string | null
  toast: { message: string; type: 'success' | 'info' | 'error' } | null
  isPinModalOpen: boolean
  isForgotModalOpen: boolean
  setIsPinModalOpen: (open: boolean) => void
  setIsForgotModalOpen: (open: boolean) => void
  handleLogin: (credentials: LoginInput) => Promise<boolean>
  handlePinLogin: (pin: string) => Promise<boolean>
  handleLogout: () => Promise<void>
  clearError: () => void
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void
}

export function useAuth(onLoginSuccess?: (user: User) => void): UseAuthReturn {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPinModalOpen, setIsPinModalOpen] = useState(false)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(
    null
  )

  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'error' = 'success'): void => {
      setToast({ message, type })
      setTimeout(() => {
        setToast(null)
      }, 3500)
    },
    []
  )

  // Comprobar sesión existente al arrancar
  useEffect(() => {
    let isMounted = true
    getCurrentUserApi()
      .then((user) => {
        if (isMounted && user) {
          setCurrentUser(user)
          onLoginSuccess?.(user)
        }
      })
      .catch(() => {})

    return () => {
      isMounted = false
    }
  }, [onLoginSuccess])

  // Atajos globales de Windows 11 para la pantalla de login (F10 -> PIN, F1 -> Ayuda/Recuperar, Esc -> Cerrar modal)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'F10') {
        e.preventDefault()
        setIsForgotModalOpen(false)
        setIsPinModalOpen(true)
      } else if (e.key === 'F1') {
        e.preventDefault()
        setIsPinModalOpen(false)
        setIsForgotModalOpen(true)
      } else if (e.key === 'Escape') {
        setIsPinModalOpen(false)
        setIsForgotModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogin = async (credentials: LoginInput): Promise<boolean> => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      showToast('Autenticando credenciales corporativas en Active Directory...', 'info')
      const res = await loginApi(credentials)
      if (res.success && res.user) {
        setCurrentUser(res.user)
        showToast(`¡Bienvenido, ${res.user.name}! Sesión iniciada.`, 'success')
        onLoginSuccess?.(res.user)
        return true
      } else {
        const error = res.error || 'Credenciales inválidas.'
        setErrorMessage(error)
        showToast(error, 'error')
        return false
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con el servidor.'
      setErrorMessage(msg)
      showToast(msg, 'error')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handlePinLogin = async (pin: string): Promise<boolean> => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await loginPinApi({ pin, station: 'CAJA-01' })
      if (res.success && res.user) {
        setIsPinModalOpen(false)
        setCurrentUser(res.user)
        showToast(`PIN validado. Sesión abierta para ${res.user.name}.`, 'success')
        onLoginSuccess?.(res.user)
        return true
      } else {
        const error = res.error || 'PIN no válido.'
        setErrorMessage(error)
        showToast(error, 'error')
        return false
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al validar el PIN.'
      setErrorMessage(msg)
      showToast(msg, 'error')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async (): Promise<void> => {
    await logoutApi()
    setCurrentUser(null)
    showToast('Sesión cerrada correctamente.', 'info')
  }

  const clearError = (): void => setErrorMessage(null)

  return {
    currentUser,
    isAuthenticated: currentUser !== null,
    isLoading,
    errorMessage,
    toast,
    isPinModalOpen,
    isForgotModalOpen,
    setIsPinModalOpen,
    setIsForgotModalOpen,
    handleLogin,
    handlePinLogin,
    handleLogout,
    clearError,
    showToast
  }
}
