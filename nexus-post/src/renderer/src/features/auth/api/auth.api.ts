import type { LoginInput, PinLoginInput, AuthResponse, User } from '@shared/contracts'

export async function loginApi(input: LoginInput): Promise<AuthResponse> {
  if (window.api?.auth?.login) {
    return window.api.auth.login(input)
  }
  // Fallback demo local si no corre en electron context
  if (
    input.emailOrUsername === 'cajero.central@nexuspos.pe' &&
    input.password === 'SecurityKey#2026'
  ) {
    return {
      success: true,
      user: {
        id: 'usr-cajero-01',
        username: 'cajero.central',
        email: 'cajero.central@nexuspos.pe',
        name: 'Carlos Morales',
        role: 'CASHIER',
        active: true,
        branch: input.branch ?? 'Sucursal Central - Javier Prado',
        station: 'CAJA-01'
      }
    }
  }
  return { success: false, error: 'Credenciales inválidas.' }
}

export async function loginPinApi(input: PinLoginInput): Promise<AuthResponse> {
  if (window.api?.auth?.loginWithPin) {
    return window.api.auth.loginWithPin(input)
  }
  if (input.pin === '1234') {
    return {
      success: true,
      user: {
        id: 'usr-cajero-01',
        username: 'cajero.central',
        email: 'cajero.central@nexuspos.pe',
        name: 'Carlos Morales',
        role: 'CASHIER',
        active: true,
        branch: 'Sucursal Central - Javier Prado',
        station: 'CAJA-01'
      }
    }
  }
  return { success: false, error: 'PIN no reconocido.' }
}

export async function logoutApi(): Promise<void> {
  if (window.api?.auth?.logout) {
    await window.api.auth.logout()
  }
}

export async function getCurrentUserApi(): Promise<User | null> {
  if (window.api?.auth?.getCurrentUser) {
    return window.api.auth.getCurrentUser()
  }
  return null
}
