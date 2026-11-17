import { app, dialog, ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type {
  DatabaseBackup,
  DatabaseBackupSummary,
  DatabaseStatus,
  DatabaseStatusSummary
} from '@shared/contracts'
import type { DatabaseMaintenanceService } from '../domain/settings/database-maintenance.service'

function toStatusSummary(status: DatabaseStatus): DatabaseStatusSummary {
  return {
    integrity: status.integrity,
    lastBackupAt: status.lastBackupAt
  }
}

function toBackupSummary(backup: DatabaseBackup): DatabaseBackupSummary {
  return {
    createdAt: backup.createdAt,
    remoteStatus: backup.remoteStatus
  }
}

export function registerDatabaseIpc(database: DatabaseMaintenanceService): void {
  ipcMain.handle(IPC_CHANNELS.database.getStatus, () => toStatusSummary(database.getStatus()))
  ipcMain.handle(IPC_CHANNELS.database.listBackups, async () =>
    (await database.listBackups()).map(toBackupSummary)
  )
  ipcMain.handle(IPC_CHANNELS.database.createBackup, async () =>
    toBackupSummary(await database.createBackup())
  )
  ipcMain.handle(IPC_CHANNELS.database.verifyIntegrity, () =>
    toStatusSummary(database.verifyIntegrity())
  )
  ipcMain.handle(IPC_CHANNELS.database.optimize, async () =>
    toStatusSummary(await database.optimize())
  )
  ipcMain.handle(IPC_CHANNELS.database.restoreBackup, async () => {
    const selection = await dialog.showOpenDialog({
      title: 'Seleccionar respaldo de NexusPOS',
      properties: ['openFile'],
      filters: [
        { name: 'Copias de seguridad compatibles', extensions: ['sqlite', 'sqlite3', 'db'] }
      ]
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
