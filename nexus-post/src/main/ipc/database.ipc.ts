import { app, dialog, ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type { DatabaseMaintenanceService } from '../domain/settings/database-maintenance.service'

export function registerDatabaseIpc(database: DatabaseMaintenanceService): void {
  ipcMain.handle(IPC_CHANNELS.database.getStatus, () => database.getStatus())
  ipcMain.handle(IPC_CHANNELS.database.listBackups, () => database.listBackups())
  ipcMain.handle(IPC_CHANNELS.database.createBackup, () => database.createBackup())
  ipcMain.handle(IPC_CHANNELS.database.verifyIntegrity, () => database.verifyIntegrity())
  ipcMain.handle(IPC_CHANNELS.database.optimize, () => database.optimize())
  ipcMain.handle(IPC_CHANNELS.database.restoreBackup, async () => {
    const selection = await dialog.showOpenDialog({
      title: 'Seleccionar respaldo de NexusPOS',
      properties: ['openFile'],
      filters: [{ name: 'Respaldos SQLite', extensions: ['sqlite', 'sqlite3', 'db'] }]
    })
    if (selection.canceled || !selection.filePaths[0]) return

    const confirm = await dialog.showMessageBox({
      type: 'warning',
      title: 'Confirmar restauración',
      message: 'La restauración reemplazará la base de datos actual.',
      detail:
        'Antes de reemplazarla se guardará automáticamente un respaldo de seguridad. NexusPOS se reiniciará para cargar la base restaurada.',
      buttons: ['Cancelar', 'Restaurar y reiniciar'],
      defaultId: 0,
      cancelId: 0,
      noLink: true
    })
    if (confirm.response !== 1) return

    await database.restoreBackup(selection.filePaths[0])
    app.relaunch()
    app.exit(0)
  })
}
