import { openAsBlob } from 'node:fs'
import type { DatabaseBackup } from '@shared/contracts'
import type { BackupUploadPort } from '../../ports/database-maintenance.repository'

const REQUEST_TIMEOUT_MS = 120_000

export class LaravelDatabaseBackupAdapter implements BackupUploadPort {
  private readonly endpoint = process.env.NOVUS_BACKUP_API_URL?.trim() ?? ''
  private readonly token = process.env.NOVUS_BACKUP_API_TOKEN?.trim()

  isConfigured(): boolean {
    return this.endpoint.length > 0
  }

  async upload(backup: DatabaseBackup, filePath: string): Promise<void> {
    if (!this.endpoint) throw new Error('NOVUS_BACKUP_API_URL no está configurada.')
    if (!backup.sha256) throw new Error('El respaldo no tiene un hash de integridad calculado.')
    const url = new URL(this.endpoint)
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('El endpoint de respaldo debe usar HTTP o HTTPS.')
    }

    const databaseFile = await openAsBlob(filePath, { type: 'application/vnd.sqlite3' })
    if (!databaseFile) throw new Error('No se pudo abrir el archivo de respaldo.')
    const form = new FormData()
    form.append('database', databaseFile, backup.fileName)
    form.append('created_at', backup.createdAt)
    form.append('sha256', backup.sha256)
    form.append('source', 'novuspos-desktop')

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
      },
      body: form,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    })
    if (!response.ok) {
      throw new Error(`Laravel respondió con HTTP ${response.status}.`)
    }
  }
}
