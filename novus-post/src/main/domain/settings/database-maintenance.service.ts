import type { DatabaseBackup, DatabaseStatus } from '@shared/contracts'
import type {
  BackupUploadPort,
  DatabaseMaintenanceRepository
} from '../../ports/database-maintenance.repository'
import type { AuthService } from '../auth/auth.service'

export class DatabaseMaintenanceService {
  constructor(
    private readonly repository: DatabaseMaintenanceRepository,
    private readonly uploader: BackupUploadPort,
    private readonly auth: AuthService
  ) {}

  getStatus(): DatabaseStatus {
    this.requireAdmin()
    return this.repository.getStatus()
  }

  listBackups(): Promise<DatabaseBackup[]> {
    this.requireAdmin()
    return this.repository.listBackups()
  }

  async createBackup(): Promise<DatabaseBackup> {
    this.requireAdmin()
    if (!this.uploader.isConfigured()) {
      const backup = await this.repository.createBackup()
      return {
        ...backup,
        remoteStatus: 'not-configured',
        remoteMessage:
          'El respaldo local está listo. Configure NOVUS_BACKUP_API_URL cuando Laravel publique el endpoint.'
      }
    }

    const backup = await this.repository.createBackup()
    try {
      await this.uploader.upload(backup, this.repository.getBackupPath(backup.fileName))
      return { ...backup, remoteStatus: 'uploaded', remoteMessage: 'Respaldo enviado a Laravel.' }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      return {
        ...backup,
        remoteStatus: 'failed',
        remoteMessage: `El respaldo local está listo, pero falló el envío a Laravel: ${message}`
      }
    }
  }

  verifyIntegrity(): DatabaseStatus {
    this.requireAdmin()
    return this.repository.verifyIntegrity()
  }

  async optimize(): Promise<DatabaseStatus> {
    this.requireAdmin()
    await this.repository.createBackup()
    return this.repository.optimize()
  }

  async restoreBackup(sourcePath: string): Promise<void> {
    this.requireAdmin()
    if (!sourcePath.trim()) throw new Error('Seleccione un archivo de respaldo.')
    await this.repository.restoreBackup(sourcePath)
  }

  private requireAdmin(): void {
    const user = this.auth.getSessionUser()
    if (!user) throw new Error('Debe iniciar sesión para administrar la base de datos.')
    if (user.role !== 'ADMIN') {
      throw new Error('Acceso denegado: solo el Administrador puede administrar la base de datos.')
    }
  }
}
