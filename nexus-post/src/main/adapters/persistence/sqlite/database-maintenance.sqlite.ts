import { createHash } from 'node:crypto'
import { createReadStream, readdirSync, statSync } from 'node:fs'
import { mkdir, readdir, rename, rm, stat } from 'node:fs/promises'
import { extname, join, parse, resolve } from 'node:path'
import Database from 'better-sqlite3'
import type { DatabaseBackup, DatabaseStatus } from '@shared/contracts'
import type { DatabaseMaintenanceRepository } from '../../../ports/database-maintenance.repository'

const BACKUP_PREFIX = 'nexuspos_backup_'
const SQLITE_EXTENSIONS = new Set(['.sqlite', '.sqlite3', '.db'])

function hashFile(path: string): Promise<string> {
  return new Promise((resolveHash, reject) => {
    const hash = createHash('sha256')
    const stream = createReadStream(path)
    stream.on('error', reject)
    stream.on('data', (chunk: string | Buffer) => hash.update(chunk))
    stream.on('end', () => resolveHash(hash.digest('hex')))
  })
}

export class SqliteDatabaseMaintenanceRepository implements DatabaseMaintenanceRepository {
  constructor(
    private readonly db: Database.Database,
    private readonly backupDirectory: string,
    private readonly appMigrationVersion: number,
    private readonly databaseFilePath: string,
    private readonly closeConnection: () => void
  ) {}

  getBackupPath(fileName: string): string {
    if (parse(fileName).base !== fileName || !fileName.startsWith(BACKUP_PREFIX)) {
      throw new Error('El nombre del respaldo no es válido.')
    }
    return join(this.backupDirectory, fileName)
  }

  getStatus(): DatabaseStatus {
    const filePath = this.databaseFilePath
    const integrityRows = this.db.pragma('integrity_check') as Array<{ integrity_check: string }>
    const integrityMessage = integrityRows.map((row) => row.integrity_check).join('; ')
    const pageCount = Number(
      (this.db.pragma('page_count') as Array<{ page_count: number }>)[0]?.page_count ?? 0
    )
    const freePages = Number(
      (this.db.pragma('freelist_count') as Array<{ freelist_count: number }>)[0]?.freelist_count ??
        0
    )
    const schemaVersion = Number(
      (
        this.db.prepare('SELECT COALESCE(MAX(version), 0) AS version FROM _migrations').get() as {
          version: number
        }
      ).version
    )
    const dbSize = this.fileSize(filePath) + this.fileSize(`${filePath}-wal`)
    const backupFiles = this.backupFiles()
    const latestBackup = backupFiles[0]

    return {
      fileName: parse(filePath).base,
      sizeBytes: dbSize,
      integrity: integrityMessage === 'ok' ? 'ok' : 'error',
      integrityMessage,
      pageCount,
      freePages,
      schemaVersion,
      productCount: this.countRows('products'),
      salesCount: this.countRows('sales'),
      customerCount: this.countRows('customers'),
      lastBackupAt: latestBackup?.createdAt ?? null
    }
  }

  async listBackups(): Promise<DatabaseBackup[]> {
    await mkdir(this.backupDirectory, { recursive: true })
    const rows = await Promise.all(
      (await readdir(this.backupDirectory))
        .filter((name) => name.startsWith(BACKUP_PREFIX) && SQLITE_EXTENSIONS.has(extname(name)))
        .map(async (fileName) => {
          const path = join(this.backupDirectory, fileName)
          const details = await stat(path)
          return {
            fileName,
            createdAt: details.mtime.toISOString(),
            sizeBytes: details.size
          }
        })
    )
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20)
  }

  async createBackup(): Promise<DatabaseBackup> {
    await mkdir(this.backupDirectory, { recursive: true })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `${BACKUP_PREFIX}${timestamp}.sqlite`
    const path = this.getBackupPath(fileName)
    await this.db.backup(path)
    const backupDb = new Database(path, { readonly: true, fileMustExist: true })
    try {
      this.validateNexusDatabase(backupDb)
    } finally {
      backupDb.close()
    }
    const details = await stat(path)
    return {
      fileName,
      createdAt: details.mtime.toISOString(),
      sizeBytes: details.size,
      sha256: await hashFile(path)
    }
  }

  verifyIntegrity(): DatabaseStatus {
    return this.getStatus()
  }

  optimize(): DatabaseStatus {
    this.db.pragma('wal_checkpoint(TRUNCATE)')
    this.db.pragma('optimize')
    this.db.exec('VACUUM')
    return this.getStatus()
  }

  async restoreBackup(sourcePath: string): Promise<void> {
    const source = resolve(sourcePath)
    const destination = resolve(this.databaseFilePath)
    if (source === destination) {
      throw new Error('Seleccione una copia distinta de la base de datos activa.')
    }
    if (!SQLITE_EXTENSIONS.has(extname(source).toLowerCase())) {
      throw new Error('El archivo seleccionado no es una base SQLite (.sqlite, .sqlite3 o .db).')
    }

    const stagedPath = `${destination}.restore-${Date.now()}`
    const previousDbBackup = await this.createBackup()
    const safetyPath = this.getBackupPath(previousDbBackup.fileName)

    try {
      const sourceDb = new Database(source, { readonly: true, fileMustExist: true })
      try {
        this.validateNexusDatabase(sourceDb)
        await sourceDb.backup(stagedPath)
      } finally {
        sourceDb.close()
      }

      const stagedDb = new Database(stagedPath, { readonly: true, fileMustExist: true })
      try {
        this.validateNexusDatabase(stagedDb)
      } finally {
        stagedDb.close()
      }

      this.db.pragma('wal_checkpoint(TRUNCATE)')
      this.closeConnection()
      await rm(`${destination}-wal`, { force: true })
      await rm(`${destination}-shm`, { force: true })
      await rename(stagedPath, destination)
    } catch (error) {
      await rm(stagedPath, { force: true })
      if (!this.db.open) {
        const recoveryDb = new Database(safetyPath, { readonly: true, fileMustExist: true })
        try {
          await recoveryDb.backup(destination)
        } finally {
          recoveryDb.close()
        }
      }
      throw error
    }
  }

  private validateNexusDatabase(database: Database.Database): void {
    const integrityRows = database.pragma('integrity_check') as Array<{
      integrity_check: string
    }>
    if (integrityRows.length !== 1 || integrityRows[0].integrity_check !== 'ok') {
      throw new Error('La copia seleccionada presenta errores de integridad SQLite.')
    }

    const requiredTables = ['_migrations', 'products', 'sales', 'customers']
    const tableRows = database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all() as Array<{ name: string }>
    const tableNames = new Set(tableRows.map((row) => row.name))
    if (requiredTables.some((name) => !tableNames.has(name))) {
      throw new Error('El archivo no contiene el esquema requerido de NexusPOS.')
    }
    const row = database
      .prepare('SELECT COALESCE(MAX(version), 0) AS version FROM _migrations')
      .get() as {
      version: number
    }
    if (row.version < 1) {
      throw new Error('El archivo no contiene una versión de esquema NexusPOS reconocida.')
    }
    if (row.version > this.appMigrationVersion) {
      throw new Error('La copia fue creada con una versión de NexusPOS más reciente.')
    }
  }

  private backupFiles(): Array<{ createdAt: string }> {
    try {
      const names = readdirSync(this.backupDirectory)
      return names
        .filter((name) => name.startsWith(BACKUP_PREFIX) && SQLITE_EXTENSIONS.has(extname(name)))
        .map((name) => ({
          createdAt: this.fileModifiedAt(join(this.backupDirectory, name))
        }))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
      throw error
    }
  }

  private countRows(table: 'products' | 'sales' | 'customers'): number {
    return Number(
      (this.db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number }).count
    )
  }

  private fileSize(path: string): number {
    try {
      return statSync(path).size
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return 0
      throw error
    }
  }

  private fileModifiedAt(path: string): string {
    return statSync(path).mtime.toISOString()
  }
}
