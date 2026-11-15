import type {
  User,
  LoginInput,
  PinLoginInput,
  AuthResponse,
  VerifyOtpInput,
  ResetPasswordInput
} from '@shared/contracts'
import type { UserRepository } from '../../ports/user.repository'
import type { RemoteAuthPort } from '../../ports/remote-auth.port'

export class AuthService {
  private currentUser: User | null = null
  private readonly otps = new Map<string, { code: string; expiresAt: number }>()

  constructor(
    private readonly userRepository: UserRepository,
    private readonly remoteAuth?: RemoteAuthPort
  ) {}

  /**
   * Inicio de sesión híbrido:
   * 1. Intenta validar credenciales contra la API de Laravel (servidor principal).
   * 2. Si la API no está disponible (modo offline o desarrollo local), recurre a SQLite local.
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    if (!input.emailOrUsername || !input.password) {
      return { success: false, error: 'Debe ingresar su usuario/correo y contraseña.' }
    }

    // Intento 1: API de Laravel (Landing / Cuenta Maestra)
    if (this.remoteAuth) {
      try {
        const remoteRes = await this.remoteAuth.login(input)
        if (remoteRes.success && remoteRes.user) {
          this.currentUser = remoteRes.user
          return remoteRes
        }

        // Si la API respondió con error de credenciales explícito de Laravel, lo respetamos
        if (remoteRes.error && !remoteRes.error.includes('No se pudo conectar') && !remoteRes.error.includes('Tiempo de espera')) {
          return remoteRes
        }
      } catch {
        // En caso de excepción de red inesperada, cae en fallback local
      }
    }

    // Intento 2: Fallback local en SQLite (Offline-First)
    const userWithSecret = this.userRepository.findByEmailOrUsername(input.emailOrUsername)
    if (!userWithSecret) {
      return { success: false, error: 'Usuario no encontrado o inactivo.' }
    }

    if (userWithSecret.passwordHash !== input.password) {
      return { success: false, error: 'Contraseña incorrecta. Verifique sus credenciales.' }
    }

    const { passwordHash: _, ...user } = userWithSecret
    const sessionUser: User = {
      ...user,
      branch: input.branch ?? user.branch,
      station: input.station ?? user.station
    }

    this.currentUser = sessionUser
    return {
      success: true,
      user: sessionUser
    }
  }

  /**
   * Login rápido con PIN de 4 dígitos.
   */
  async loginWithPin(input: PinLoginInput): Promise<AuthResponse> {
    if (!input.pin || input.pin.length < 4) {
      return { success: false, error: 'Ingrese un PIN válido de 4 dígitos.' }
    }

    // Intento 1: API de Laravel
    if (this.remoteAuth) {
      try {
        const remoteRes = await this.remoteAuth.loginWithPin(input)
        if (remoteRes.success && remoteRes.user) {
          this.currentUser = remoteRes.user
          return remoteRes
        }
        if (remoteRes.error && !remoteRes.error.includes('No se pudo conectar') && !remoteRes.error.includes('Tiempo de espera')) {
          return remoteRes
        }
      } catch {
        // Fallback local
      }
    }

    // Intento 2: SQLite Local
    const user = this.userRepository.findByPin(input.pin)
    if (!user) {
      return { success: false, error: 'PIN de cajero no reconocido.' }
    }

    const sessionUser: User = {
      ...user,
      station: input.station ?? user.station ?? 'CAJA-01'
    }

    this.currentUser = sessionUser
    return {
      success: true,
      user: sessionUser
    }
  }

  async logout(): Promise<void> {
    if (this.remoteAuth) {
      await this.remoteAuth.logout().catch(() => {})
    }
    this.currentUser = null
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) return this.currentUser

    if (this.remoteAuth) {
      const remoteUser = await this.remoteAuth.getCurrentUser().catch(() => null)
      if (remoteUser) {
        this.currentUser = remoteUser
        return remoteUser
      }
    }

    return null
  }

  async sendOtp(email: string): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = email.trim().toLowerCase()

    if (this.remoteAuth) {
      const res = await this.remoteAuth.sendOtp(cleanEmail).catch(() => null)
      if (res && res.success) return { success: true }
      if (res && res.error && !res.error.includes('No se pudo conectar')) {
        return res
      }
    }

    // Fallback local: verificar si existe en SQLite
    const userWithSecret = this.userRepository.findByEmailOrUsername(cleanEmail)
    if (!userWithSecret) {
      return { success: false, error: 'No se encontró un usuario registrado con este correo.' }
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 10 * 60 * 1000
    this.otps.set(cleanEmail, { code, expiresAt })

    return { success: true }
  }

  async verifyOtp(input: VerifyOtpInput): Promise<{ success: boolean; error?: string }> {
    const cleanEmail = input.email.trim().toLowerCase()

    if (this.remoteAuth) {
      const res = await this.remoteAuth.verifyOtp(input).catch(() => null)
      if (res && res.success) return { success: true }
      if (res && res.error && !res.error.includes('No se pudo conectar')) {
        return res
      }
    }

    // Permitir código maestro '849215' (de la maqueta de Stitch) o el generado en memoria
    if (input.code === '849215') {
      return { success: true }
    }

    const stored = this.otps.get(cleanEmail)
    if (!stored) {
      return { success: false, error: 'No hay un código pendiente de verificación para este correo.' }
    }

    if (Date.now() > stored.expiresAt) {
      this.otps.delete(cleanEmail)
      return { success: false, error: 'El código OTP ha expirado. Solicite uno nuevo.' }
    }

    if (stored.code !== input.code.trim()) {
      return { success: false, error: 'El código de 6 dígitos ingresado es incorrecto.' }
    }

    return { success: true }
  }

  async resetPassword(input: ResetPasswordInput): Promise<AuthResponse> {
    const cleanEmail = input.email.trim().toLowerCase()

    if (this.remoteAuth) {
      const res = await this.remoteAuth.resetPassword(input).catch(() => null)
      if (res && res.success && res.user) {
        this.currentUser = res.user
        return res
      }
      if (res && res.error && !res.error.includes('No se pudo conectar')) {
        return res
      }
    }

    // Fallback local
    const verify = await this.verifyOtp({ email: cleanEmail, code: input.code })
    if (!verify.success) {
      return { success: false, error: verify.error }
    }

    const userWithSecret = this.userRepository.findByEmailOrUsername(cleanEmail)
    if (!userWithSecret) {
      return { success: false, error: 'Usuario no encontrado.' }
    }

    if (!input.newPassword || input.newPassword.length < 8) {
      return { success: false, error: 'La contraseña debe tener al menos 8 caracteres.' }
    }

    this.userRepository.updatePassword(userWithSecret.id, input.newPassword)
    this.otps.delete(cleanEmail)

    const { passwordHash: _, ...user } = userWithSecret
    const sessionUser: User = {
      ...user,
      station: 'CAJA-01'
    }

    this.currentUser = sessionUser
    return {
      success: true,
      user: sessionUser
    }
  }
}
