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

export interface DatabaseStatusSummary {
  integrity: 'ok' | 'error'
  lastBackupAt: string | null
}

export interface DatabaseBackupSummary {
  createdAt: string
  remoteStatus?: BackupRemoteStatus
}

export interface DatabaseMaintenanceApi {
  getStatus(): Promise<DatabaseStatusSummary>
  listBackups(): Promise<DatabaseBackupSummary[]>
  createBackup(): Promise<DatabaseBackupSummary>
  verifyIntegrity(): Promise<DatabaseStatusSummary>
  optimize(): Promise<DatabaseStatusSummary>
  restoreBackup(): Promise<void>
}
