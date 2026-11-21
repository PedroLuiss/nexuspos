import Database from 'better-sqlite3'
import { app } from 'electron'
import { copyFileSync, existsSync } from 'fs'
import { join } from 'path'

let instance: Database.Database | null = null
let databaseFilePath: string | null = null

/**
 * Devuelve la conexión SQLite única de la aplicación.
 * Se abre bajo `userData/novuspos.sqlite` con WAL para lectura/escritura concurrente.
 * Si existe una base previa `nexuspos.sqlite`, se migra automáticamente sin pérdida de datos.
 */
export function getDatabase(): Database.Database {
  if (instance) return instance

  const defaultDbPath = join(app.getPath('userData'), 'novuspos.sqlite')
  const legacyDbPath = join(app.getPath('userData'), 'nexuspos.sqlite')

  if (!process.env.NOVUSPOS_DB_PATH && !process.env.NEXUSPOS_DB_PATH) {
    try {
      if (!existsSync(defaultDbPath) && existsSync(legacyDbPath)) {
        copyFileSync(legacyDbPath, defaultDbPath)
        if (existsSync(`${legacyDbPath}-wal`)) copyFileSync(`${legacyDbPath}-wal`, `${defaultDbPath}-wal`)
        if (existsSync(`${legacyDbPath}-shm`)) copyFileSync(`${legacyDbPath}-shm`, `${defaultDbPath}-shm`)
      }
    } catch {
      // Fallback si no se puede copiar
    }
  }

  const file =
    process.env.NOVUSPOS_DB_PATH ??
    process.env.NEXUSPOS_DB_PATH ??
    defaultDbPath

  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  instance = db
  databaseFilePath = file
  return db
}

export function getDatabaseFilePath(): string {
  if (!databaseFilePath) {
    const defaultDbPath = join(app.getPath('userData'), 'novuspos.sqlite')
    databaseFilePath =
      process.env.NOVUSPOS_DB_PATH ??
      process.env.NEXUSPOS_DB_PATH ??
      defaultDbPath
  }
  return databaseFilePath
}

export function closeDatabase(): void {
  if (instance) {
    instance.close()
    instance = null
  }
}
