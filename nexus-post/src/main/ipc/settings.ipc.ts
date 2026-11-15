import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type { BusinessConfigInput } from '@shared/contracts'
import type { SettingsService } from '../domain/settings/settings.service'

/**
 * Canales IPC de configuración del negocio, ticket e impuestos.
 * La lectura está disponible para cualquier sesión; la escritura se valida
 * en `SettingsService` (solo rol ADMIN).
 */
export function registerSettingsIpc(settingsService: SettingsService): void {
  ipcMain.handle(IPC_CHANNELS.settings.getBusiness, () =>
    Promise.resolve().then(() => settingsService.getBusiness())
  )

  ipcMain.handle(IPC_CHANNELS.settings.updateBusiness, (_event, input: BusinessConfigInput) =>
    Promise.resolve().then(() => settingsService.updateBusiness(input))
  )
}
