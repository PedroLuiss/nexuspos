/**
 * Configuración centralizada de Endpoints para la API de Laravel (NexusPOS Cloud / Landing).
 * Esta configuración es compartida entre `main`, `preload` y `renderer`.
 *
 * Para apuntar a tu servidor de Laravel:
 * - En local: 'http://127.0.0.1:8000/api/v1' o 'http://nexuspos.test/api/v1'
 * - En producción: 'https://api.nexuspos.pe/api/v1'
 */

export interface ApiConfiguration {
  /** URL base de la API de Laravel */
  baseUrl: string
  /** Tiempo de espera máximo en milisegundos */
  timeoutMs: number
  /** Endpoints del módulo de Autenticación y Cuentas */
  endpoints: {
    login: string
    loginPin: string
    logout: string
    me: string
    forgotPassword: string
    verifyOtp: string
    resetPassword: string
    checkLicense: string
  }
}

/** Configuración por defecto de la API de Laravel */
export const API_CONFIG: ApiConfiguration = {
  // Cuando la API de Laravel esté lista, solo se cambia esta URL base:
  baseUrl:
    (typeof process !== 'undefined' && process.env?.NEXUS_API_URL) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
    'http://127.0.0.1:8000/api/v1',
  timeoutMs: 6000,
  endpoints: {
    login: '/auth/login',
    loginPin: '/auth/pin-login',
    logout: '/auth/logout',
    me: '/auth/me',
    forgotPassword: '/auth/forgot-password',
    verifyOtp: '/auth/verify-otp',
    resetPassword: '/auth/reset-password',
    checkLicense: '/license/validate'
  }
}

/** Estructura de respuesta exitosa estándar de Laravel */
export interface LaravelAuthSuccessResponse {
  status: 'success' | true
  message?: string
  data: {
    token: string
    tokenType?: string
    user: {
      id: string | number
      name: string
      email: string
      username?: string
      role?: 'ADMIN' | 'CASHIER' | 'SUPERVISOR' | string
      branch?: string
      station?: string
      active?: boolean
      subscriptionActive?: boolean
    }
  }
}

/** Estructura de error de validación estándar de Laravel (422 Unprocessable Entity) */
export interface LaravelValidationErrorResponse {
  message: string
  errors?: Record<string, string[]>
}
