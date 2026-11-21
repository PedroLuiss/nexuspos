import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type { CreateUserInput, UpdateUserInput } from '@shared/contracts'
import type { UserService } from '../domain/users/user.service'

/**
 * Canales IPC de gestión de usuarios y permisos (RBAC).
 * La autorización se valida en `UserService` (solo sesión con rol ADMIN).
 */
export function registerUsersIpc(userService: UserService): void {
  ipcMain.handle(IPC_CHANNELS.users.list, () => Promise.resolve().then(() => userService.list()))

  ipcMain.handle(IPC_CHANNELS.users.getById, (_event, id: string) =>
    Promise.resolve().then(() => userService.getById(id))
  )

  ipcMain.handle(IPC_CHANNELS.users.create, (_event, input: CreateUserInput) =>
    Promise.resolve().then(() => userService.create(input))
  )

  ipcMain.handle(IPC_CHANNELS.users.update, (_event, input: UpdateUserInput) =>
    Promise.resolve().then(() => userService.update(input))
  )

  ipcMain.handle(IPC_CHANNELS.users.delete, (_event, id: string) =>
    Promise.resolve().then(() => userService.delete(id))
  )

  ipcMain.handle(IPC_CHANNELS.users.toggleStatus, (_event, id: string) =>
    Promise.resolve().then(() => userService.toggleStatus(id))
  )
}
