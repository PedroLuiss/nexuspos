import { useState, useEffect, useCallback } from 'react'
import type { User, LoginInput } from '@shared/contracts'
import {
  loginApi,
  loginPinApi,
  logoutApi,
  getCurrentUserApi,
  sendOtpApi,
  verifyOtpApi,
  resetPasswordApi,
  isSessionAutoRestoreBlocked,
  resetSessionAutoRestoreBlock
} from '../api/auth.api'

export type AuthStep = 'LOGIN' | 'FORGOT_EMAIL' | 'VERIFY_OTP' | 'RESET_PASSWORD'

export interface UseAuthReturn {
  currentUser: User | null
  isAuthenticated: boolean
  isLoading: boolean
  errorMessage: string | null
  toast: { message: string; type: 'success' | 'info' | 'error' } | null
  isPinModalOpen: boolean
  isForgotModalOpen: boolean
  authStep: AuthStep
  resetEmail: string
  resetCode: string
  setAuthStep: (step: AuthStep) => void
  setIsPinModalOpen: (open: boolean) => void
  setIsForgotModalOpen: (open: boolean) => void
  handleLogin: (credentials: LoginInput) => Promise<boolean>
  handlePinLogin: (pin: string) => Promise<boolean>
  handleLogout: () => Promise<void>
  handleSendOtp: (email: string) => Promise<boolean>
  handleVerifyOtp: (code: string) => Promise<boolean>
  handleResetPassword: (newPassword: string, logoutOthers: boolean) => Promise<boolean>
  clearError: () => void
  showToast: (message: string, type?: 'success' | 'info' | 'error') => void
}

export function useAuth(onLoginSuccess?: (user: User) => void): UseAuthReturn {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isPinModalOpen, setIsPinModalOpen] = useState(false)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const [authStep, setAuthStep] = useState<AuthStep>('LOGIN')
  const [resetEmail, setResetEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'info' | 'error'
  } | null>(null)

  const showToast = useCallback(
    (message: string, type: 'success' | 'info' | 'error' = 'success'): void => {
      setToast({ message, type })
      setTimeout(() => {
        setToast(null)
      }, 3500)
    },
    []
  )

  useEffect(() => {
    // Si el operador acaba de cerrar sesión, no restaurar la sesión previa del backend.
    if (isSessionAutoRestoreBlocked()) return

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (authStep !== 'LOGIN') return
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return

      if (e.key === 'F10') {
        e.preventDefault()
        setIsForgotModalOpen(false)
        setIsPinModalOpen(true)
      } else if (e.key === 'F1') {
        e.preventDefault()
        setIsPinModalOpen(false)
        setAuthStep('FORGOT_EMAIL')
      } else if (e.key === 'Escape') {
        setIsPinModalOpen(false)
        setIsForgotModalOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [authStep])

  const handleLogin = async (credentials: LoginInput): Promise<boolean> => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      showToast('Autenticando credenciales corporativas en Active Directory...', 'info')
      const res = await loginApi(credentials)
      if (res.success && res.user) {
        resetSessionAutoRestoreBlock()
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
      const msg = err instanceof Error ? err.message : 'Error de conexión.'
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
        resetSessionAutoRestoreBlock()
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

  const handleSendOtp = async (email: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      setResetEmail(email)
      const res = await sendOtpApi(email)
      if (res.success) {
        setAuthStep('VERIFY_OTP')
        showToast(`Código OTP de 6 dígitos enviado a ${email}`, 'success')
        return true
      }
      showToast(res.error || 'Error al emitir código.', 'error')
      return false
    } catch {
      showToast('Error al conectar con el dispensador de tokens.', 'error')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (code: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      const res = await verifyOtpApi({ email: resetEmail, code })
      if (res.success) {
        setResetCode(code)
        setAuthStep('RESET_PASSWORD')
        showToast('Código verificado con éxito. Defina su nueva clave.', 'success')
        return true
      }
      showToast(res.error || 'Código incorrecto.', 'error')
      return false
    } catch {
      showToast('Error al validar código.', 'error')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (
    newPassword: string,
    logoutOthers: boolean
  ): Promise<boolean> => {
    setIsLoading(true)
    try {
      const res = await resetPasswordApi({
        email: resetEmail,
        code: resetCode,
        newPassword,
        logoutOtherSessions: logoutOthers
      })
      if (res.success && res.user) {
        resetSessionAutoRestoreBlock()
        setCurrentUser(res.user)
        setAuthStep('LOGIN')
        showToast('¡Contraseña actualizada con éxito! Sesión iniciada.', 'success')
        onLoginSuccess?.(res.user)
        return true
      }
      showToast(res.error || 'No se pudo actualizar la clave.', 'error')
      return false
    } catch {
      showToast('Error al actualizar contraseña.', 'error')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async (): Promise<void> => {
    await logoutApi()
    setCurrentUser(null)
    setAuthStep('LOGIN')
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
    authStep,
    resetEmail,
    resetCode,
    setAuthStep,
    setIsPinModalOpen,
    setIsForgotModalOpen,
    handleLogin,
    handlePinLogin,
    handleLogout,
    handleSendOtp,
    handleVerifyOtp,
    handleResetPassword,
    clearError,
    showToast
  }
}
