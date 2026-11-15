import type Database from 'better-sqlite3'
import type { ScaleConfig, ScaleConfigInput } from '@shared/contracts'
import type { ScaleRepository } from '../../ports/hardware.port'

const SCALE_CONFIG_ID = 'default'

interface ScaleConfigRow {
  id: string
  com_port: string
  baud_rate: number
  is_enabled: number
  updated_at: string
  updated_by: string
}

const FALLBACK_SCALE_CONFIG: ScaleConfig = {
  id: 'default',
  comPort: 'COM3',
  baudRate: 9600,
  isEnabled: false
}

function mapRow(row: ScaleConfigRow): ScaleConfig {
  return {
    id: row.id,
    comPort: row.com_port,
    baudRate: row.baud_rate as 4800 | 9600 | 19200 | 38400 | 57600 | 115200,
    isEnabled: row.is_enabled === 1,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by || undefined
  }
}

/**
 * Adaptador SQLite de la configuración de la báscula serial.
 * Tabla de fila única (`scale_config`) creada por la migración 010.
 */
export class SqliteScaleRepository implements ScaleRepository {
  constructor(private readonly db: Database.Database) {}

  getScaleConfig(): ScaleConfig | null {
    const row = this.db
      .prepare<[string], ScaleConfigRow>('SELECT * FROM scale_config WHERE id = ?')
      .get(SCALE_CONFIG_ID)

    if (!row) return null

    return mapRow(row)
  }

  saveScaleConfig(input: ScaleConfigInput, updatedBy?: string): ScaleConfig {
    const now = new Date().toISOString()

    this.db
      .prepare(
        `UPDATE scale_config SET
          com_port = ?, baud_rate = ?, is_enabled = ?,
          updated_at = ?, updated_by = ?
        WHERE id = ?`
      )
      .run(
        input.comPort ?? 'COM3',
        input.baudRate ?? 9600,
        input.isEnabled ? 1 : 0,
        now,
        updatedBy ?? '',
        SCALE_CONFIG_ID
      )

    const row = this.getScaleConfig()
    if (!row) {
      // Si no existe (debería existir por migración), insertar
      this.db
        .prepare(
          `INSERT INTO scale_config (id, com_port, baud_rate, is_enabled, updated_at, updated_by)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(
          SCALE_CONFIG_ID,
          input.comPort ?? 'COM3',
          input.baudRate ?? 9600,
          input.isEnabled ? 1 : 0,
          now,
          updatedBy ?? ''
        )
    }

    return this.getScaleConfig() ?? FALLBACK_SCALE_CONFIG
  }
}
