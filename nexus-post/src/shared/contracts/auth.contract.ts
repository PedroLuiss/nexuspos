/**
 * Contrato compartido de Autenticación y Usuarios para NexusPOS.
 * Fuente única de verdad entre `main`, `preload` y `renderer`.
 * No contiene dependencias de React, Electron ni SQLite.
 */

export type UserRole = 'ADMIN' | 'CASHIER' | 'SUPERVISOR'

export interface User {
  id: string
  username: string
  email: string
  name: string
  role: UserRole
  pin?: string
  active: boolean
  branch?: string
  station?: string
  createdAt?: string
  updatedAt?: string
}

export interface LoginInput {
  emailOrUsername: string
  password: string
  branch?: string
  station?: string
  rememberStation?: boolean
}

export interface PinLoginInput {
  pin: string
  station?: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  error?: string
}

export interface VerifyOtpInput {
  email: string
  code: string
}

export interface ResetPasswordInput {
  email: string
  code: string
  newPassword: string
  logoutOtherSessions?: boolean
}

export interface AuthApi {
  login(input: LoginInput): Promise<AuthResponse>
  loginWithPin(input: PinLoginInput): Promise<AuthResponse>
  logout(): Promise<void>
  getCurrentUser(): Promise<User | null>
  sendOtp(email: string): Promise<{ success: boolean; error?: string }>
  verifyOtp(input: VerifyOtpInput): Promise<{ success: boolean; error?: string }>
  resetPassword(input: ResetPasswordInput): Promise<AuthResponse>
}
