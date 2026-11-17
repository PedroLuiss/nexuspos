export type BackupRemoteStatus = 'uploaded' | 'not-configured' | 'failed'

export interface DatabaseBackup {
  fileName: string
  createdAt: string
  sizeBytes: number
  sha256?: string
  remoteStatus?: BackupRemoteStatus
  remoteMessage?: string
}

export interface DatabaseStatus {
  fileName: string
  sizeBytes: number
  integrity: 'ok' | 'error'
  integrityMessage: string
  pageCount: number
  freePages: number
  schemaVersion: number
  productCount: number
  salesCount: number
  customerCount: number
  lastBackupAt: string | null
}

export interface DatabaseMaintenanceApi {
  getStatus(): Promise<DatabaseStatus>
  listBackups(): Promise<DatabaseBackup[]>
  createBackup(): Promise<DatabaseBackup>
  verifyIntegrity(): Promise<DatabaseStatus>
  optimize(): Promise<DatabaseStatus>
  restoreBackup(): Promise<void>
}
