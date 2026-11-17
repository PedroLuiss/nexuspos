import type { DatabaseBackup, DatabaseStatus } from '@shared/contracts'

export interface DatabaseMaintenanceRepository {
  getBackupPath(fileName: string): string
  getStatus(): DatabaseStatus
  listBackups(): Promise<DatabaseBackup[]>
  createBackup(): Promise<DatabaseBackup>
  verifyIntegrity(): DatabaseStatus
  optimize(): DatabaseStatus
  restoreBackup(sourcePath: string): Promise<void>
}

export interface BackupUploadPort {
  isConfigured(): boolean
  upload(backup: DatabaseBackup, filePath: string): Promise<void>
}
