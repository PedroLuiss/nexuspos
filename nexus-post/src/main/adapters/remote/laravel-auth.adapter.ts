import {
  API_CONFIG,
  type LaravelAuthSuccessResponse,
  type LaravelValidationErrorResponse
} from '@shared/config/api.config'
import type {
  LoginInput,
  PinLoginInput,
  AuthResponse,
  VerifyOtpInput,
  ResetPasswordInput,
  User,
  UserRole
} from '@shared/contracts'
import type { RemoteAuthPort } from '../../ports/remote-auth.port'

/**
 * Adaptador de Infraestructura para comunicación HTTP con el backend de Laravel (Sanctum/API).
 * Diseñado bajo Arquitectura Hexagonal para desacoplar el servicio de dominio de la red.
 */
export class LaravelAuthAdapter implements RemoteAuthPort {
  private bearerToken: string | null = null
  private baseUrl: string

  constructor(customBaseUrl?: string) {
    this.baseUrl = customBaseUrl || API_CONFIG.baseUrl
  }

  /** Permite actualizar dinámicamente la URL base si el usuario la cambia en Ajustes */
  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, '')
  }

  getBaseUrl(): string {
    return this.baseUrl
  }

  getBearerToken(): string | null {
    return this.bearerToken
  }

  setBearerToken(token: string | null): void {
    this.bearerToken = token
  }

  /**
   * Ejecuta una petición HTTP segura contra la API de Laravel con timeout y manejo de errores.
   */
  private async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
      body?: unknown
      authenticated?: boolean
    } = {}
  ): Promise<{ ok: true; data: T } | { ok: false; error: string; statusCode?: number; isNetworkError?: boolean }> {
    const url = `${this.baseUrl}${endpoint}`
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Client-Platform': 'NexusPOS-Desktop',
      'X-Client-Version': '2.4.0'
    }

    if (options.authenticated && this.bearerToken) {
      headers.Authorization = `Bearer ${this.bearerToken}`
    }

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs)

    try {
      const response = await fetch(url, {
        method: options.method ?? (options.body ? 'POST' : 'GET'),
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      })

      clearTimeout(timer)

      // Respuesta exitosa (200, 201)
      if (response.ok) {
        const json = (await response.json()) as T
        return { ok: true, data: json }
      }

      // Manejo de errores de validación de Laravel (422) o de autenticación (401, 403)
      const errorJson = (await response.json().catch(() => null)) as
        | LaravelValidationErrorResponse
        | { message?: string; error?: string }
        | null

      let errorMsg = 'Error en el servidor de autenticación.'
      if (errorJson?.message) {
        errorMsg = errorJson.message
      }
      if ('errors' in (errorJson ?? {}) && errorJson && (errorJson as LaravelValidationErrorResponse).errors) {
        const firstField = Object.keys((errorJson as LaravelValidationErrorResponse).errors!)[0]
        const firstError = (errorJson as LaravelValidationErrorResponse).errors![firstField]?.[0]
        if (firstError) {
          errorMsg = firstError
        }
      }

      return {
        ok: false,
        error: errorMsg,
        statusCode: response.status,
        isNetworkError: false
      }
    } catch (err: any) {
      clearTimeout(timer)
      const isAbort = err?.name === 'AbortError'
      const isConnectionRefused = err?.code === 'ECONNREFUSED' || err?.message?.includes('fetch failed')

      return {
        ok: false,
        error: isAbort
          ? 'Tiempo de espera agotado al conectar con el servidor de autenticación.'
          : isConnectionRefused
            ? `No se pudo conectar con la API de Laravel en ${this.baseUrl}. Servidor no disponible.`
            : `Error de red: ${err?.message ?? 'desconocido'}`,
        isNetworkError: true
      }
    }
  }

  /**
   * Endpoint: POST /api/v1/auth/login
   * Valida credenciales contra la base de datos principal de Laravel.
   */
  async login(input: LoginInput): Promise<AuthResponse & { isRemote?: boolean }> {
    const payload = {
      email: input.emailOrUsername,
      password: input.password,
      station: input.station ?? 'CAJA-01',
      branch: input.branch,
      device_name: 'NexusPOS-Windows-App'
    }

    const res = await this.request<LaravelAuthSuccessResponse>(API_CONFIG.endpoints.login, {
      method: 'POST',
      body: payload
    })

    if (!res.ok) {
      return {
        success: false,
        error: res.error
      }
    }

    const { token, user: remoteUser } = res.data.data
    this.bearerToken = token

    const user: User = {
      id: String(remoteUser.id),
      username: remoteUser.username ?? remoteUser.email.split('@')[0],
      email: remoteUser.email,
      name: remoteUser.name,
      role: (remoteUser.role?.toUpperCase() as UserRole) ?? 'CASHIER',
      active: remoteUser.active ?? true,
      branch: remoteUser.branch ?? input.branch,
      station: remoteUser.station ?? input.station ?? 'CAJA-01'
    }

    return {
      success: true,
      user,
      isRemote: true
    }
  }

  /**
   * Endpoint: POST /api/v1/auth/pin-login
   * Valida el PIN de cajero contra la API.
   */
  async loginWithPin(input: PinLoginInput): Promise<AuthResponse & { isRemote?: boolean }> {
    const payload = {
      pin: input.pin,
      station: input.station ?? 'CAJA-01',
      device_name: 'NexusPOS-Windows-App'
    }

    const res = await this.request<LaravelAuthSuccessResponse>(API_CONFIG.endpoints.loginPin, {
      method: 'POST',
      body: payload
    })

    if (!res.ok) {
      return {
        success: false,
        error: res.error
      }
    }

    const { token, user: remoteUser } = res.data.data
    this.bearerToken = token

    const user: User = {
      id: String(remoteUser.id),
      username: remoteUser.username ?? remoteUser.email.split('@')[0],
      email: remoteUser.email,
      name: remoteUser.name,
      role: (remoteUser.role?.toUpperCase() as UserRole) ?? 'CASHIER',
      active: remoteUser.active ?? true,
      station: input.station ?? 'CAJA-01'
    }

    return {
      success: true,
      user,
      isRemote: true
    }
  }

  /**
   * Endpoint: POST /api/v1/auth/logout
   * Revoca el token actual en Laravel Sanctum.
   */
  async logout(): Promise<void> {
    if (!this.bearerToken) return

    await this.request(API_CONFIG.endpoints.logout, {
      method: 'POST',
      authenticated: true
    }).catch(() => {})

    this.bearerToken = null
  }

  /**
   * Endpoint: GET /api/v1/auth/me
   * Obtiene los datos del usuario autenticado actual.
   */
  async getCurrentUser(): Promise<User | null> {
    if (!this.bearerToken) return null

    const res = await this.request<{ data: LaravelAuthSuccessResponse['data']['user'] }>(
      API_CONFIG.endpoints.me,
      {
        method: 'GET',
        authenticated: true
      }
    )

    if (!res.ok) return null

    const remote = res.data.data
    return {
      id: String(remote.id),
      username: remote.username ?? remote.email.split('@')[0],
      email: remote.email,
      name: remote.name,
      role: (remote.role?.toUpperCase() as UserRole) ?? 'CASHIER',
      active: remote.active ?? true,
      station: remote.station ?? 'CAJA-01'
    }
  }

  /**
   * Endpoint: POST /api/v1/auth/forgot-password
   * Solicita el envío de OTP por correo desde Laravel Mailer.
   */
  async sendOtp(email: string): Promise<{ success: boolean; error?: string }> {
    const res = await this.request<{ message?: string }>(API_CONFIG.endpoints.forgotPassword, {
      method: 'POST',
      body: { email }
    })

    if (!res.ok) {
      return { success: false, error: res.error }
    }

    return { success: true }
  }

  /**
   * Endpoint: POST /api/v1/auth/verify-otp
   * Verifica la validez del código OTP de 6 dígitos en Laravel.
   */
  async verifyOtp(input: VerifyOtpInput): Promise<{ success: boolean; error?: string }> {
    const res = await this.request<{ message?: string }>(API_CONFIG.endpoints.verifyOtp, {
      method: 'POST',
      body: { email: input.email, code: input.code }
    })

    if (!res.ok) {
      return { success: false, error: res.error }
    }

    return { success: true }
  }

  /**
   * Endpoint: POST /api/v1/auth/reset-password
   * Actualiza la clave del usuario en Laravel y revoca tokens antiguos.
   */
  async resetPassword(input: ResetPasswordInput): Promise<AuthResponse> {
    const res = await this.request<LaravelAuthSuccessResponse>(API_CONFIG.endpoints.resetPassword, {
      method: 'POST',
      body: {
        email: input.email,
        code: input.code,
        password: input.newPassword,
        password_confirmation: input.newPassword,
        logout_other_sessions: input.logoutOtherSessions ?? true
      }
    })

    if (!res.ok) {
      return { success: false, error: res.error }
    }

    const { token, user: remoteUser } = res.data.data
    this.bearerToken = token

    return {
      success: true,
      user: {
        id: String(remoteUser.id),
        username: remoteUser.username ?? remoteUser.email.split('@')[0],
        email: remoteUser.email,
        name: remoteUser.name,
        role: (remoteUser.role?.toUpperCase() as UserRole) ?? 'CASHIER',
        active: remoteUser.active ?? true,
        station: 'CAJA-01'
      }
    }
  }
}
