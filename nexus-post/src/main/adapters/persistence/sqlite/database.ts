import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'

let instance: Database.Database | null = null

/**
 * Devuelve la conexión SQLite única de la aplicación.
 * Se abre bajo `userData/nexuspos.sqlite` con WAL para lectura/escritura concurrente.
 */
export function getDatabase(): Database.Database {
  if (instance) return instance

  const file = process.env.NEXUSPOS_DB_PATH ?? join(app.getPath('userData'), 'nexuspos.sqlite')
  const db = new Database(file)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  instance = db
  return db
}

export function closeDatabase(): void {
  if (instance) {
    instance.close()
    instance = null
  }
}
