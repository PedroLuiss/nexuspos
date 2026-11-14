import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type { LoginInput, PinLoginInput, AuthResponse, User } from '@shared/contracts'
import type { AuthService } from '../domain/auth/auth.service'

/** Registra los canales IPC del dominio de Autenticación. */
export function registerAuthIpc(auth: AuthService): void {
  ipcMain.handle(
    IPC_CHANNELS.auth.login,
    (_event, input: LoginInput): Promise<AuthResponse> => {
      return Promise.resolve(auth.login(input))
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.auth.loginPin,
    (_event, input: PinLoginInput): Promise<AuthResponse> => {
      return Promise.resolve(auth.loginWithPin(input))
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.auth.logout,
    (_event): Promise<void> => {
      auth.logout()
      return Promise.resolve()
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.auth.getCurrentUser,
    (_event): Promise<User | null> => {
      return Promise.resolve(auth.getCurrentUser())
    }
  )
}
