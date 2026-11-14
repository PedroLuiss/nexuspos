import type { User, LoginInput, PinLoginInput, AuthResponse } from '@shared/contracts'
import type { UserRepository } from '../../ports/user.repository'

export class AuthService {
  private currentUser: User | null = null

  constructor(private readonly userRepository: UserRepository) {}

  login(input: LoginInput): AuthResponse {
    if (!input.emailOrUsername || !input.password) {
      return { success: false, error: 'Debe ingresar su usuario/correo y contraseña.' }
    }

    const userWithSecret = this.userRepository.findByEmailOrUsername(input.emailOrUsername)
    if (!userWithSecret) {
      return { success: false, error: 'Usuario no encontrado o inactivo.' }
    }

    // Comprobación de contraseña
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

  loginWithPin(input: PinLoginInput): AuthResponse {
    if (!input.pin || input.pin.length < 4) {
      return { success: false, error: 'Ingrese un PIN válido de 4 dígitos.' }
    }

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

  logout(): void {
    this.currentUser = null
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }
}
