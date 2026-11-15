import type {
  LoginInput,
  PinLoginInput,
  AuthResponse,
  VerifyOtpInput,
  ResetPasswordInput,
  User
} from '@shared/contracts'

/**
 * Puerto de Infraestructura para Autenticación Remota (API de Laravel).
 * Desacopla el dominio de la tecnología HTTP concreta.
 */
export interface RemoteAuthPort {
  /** Valida credenciales contra la API de Laravel */
  login(input: LoginInput): Promise<AuthResponse & { isRemote?: boolean }>

  /** Valida PIN de cajero contra la API de Laravel */
  loginWithPin(input: PinLoginInput): Promise<AuthResponse & { isRemote?: boolean }>

  /** Cierra sesión y revoca token en Laravel */
  logout(): Promise<void>

  /** Consulta usuario actual en Laravel */
  getCurrentUser(): Promise<User | null>

  /** Emite OTP de recuperación desde Laravel */
  sendOtp(email: string): Promise<{ success: boolean; error?: string }>

  /** Valida código OTP en Laravel */
  verifyOtp(input: VerifyOtpInput): Promise<{ success: boolean; error?: string }>

  /** Restablece la contraseña en Laravel */
  resetPassword(input: ResetPasswordInput): Promise<AuthResponse>

  /** Obtiene la URL base configurada */
  getBaseUrl(): string
}
