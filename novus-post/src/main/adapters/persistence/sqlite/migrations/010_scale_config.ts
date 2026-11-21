import type Database from 'better-sqlite3'
import type { Migration } from './index'

/**
 * Tabla de configuración de la báscula serial (RS-232).
 * Almacena el puerto COM, baud rate y estado habilitado.
 * Se siembra con valores por defecto (COM3, 9600 bps, deshabilitado).
 */
export const migration010ScaleConfig: Migration = {
  version: 10,
  name: 'scale_config',
  up(db: Database.Database): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS scale_config (
        id TEXT PRIMARY KEY,
        com_port TEXT NOT NULL DEFAULT 'COM3',
        baud_rate INTEGER NOT NULL DEFAULT 9600,
        is_enabled INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL,
        updated_by TEXT NOT NULL DEFAULT ''
      );
    `)

    const now = new Date().toISOString()
    const insert = db.prepare(`
      INSERT OR IGNORE INTO scale_config (
        id, com_port, baud_rate, is_enabled, updated_at, updated_by
      ) VALUES (
        'default', 'COM3', 9600, 0, ?, ''
      )
    `)

    insert.run(now)
  }
}
