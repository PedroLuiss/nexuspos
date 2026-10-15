import type Database from 'better-sqlite3'

export interface Migration {
  version: number
  name: string
  up: (db: Database.Database) => void
}

import { migration001Products } from './001_products'
import { migration002StockMovements } from './002_stock_movements'
import { migration003Categories } from './003_categories'

const MIGRATIONS: Migration[] = [
  migration001Products,
  migration002StockMovements,
  migration003Categories
]

/** Ejecuta de forma idempotente las migraciones pendientes. */
export function runMigrations(db: Database.Database): void {
  db.exec(
    `CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )`
  )

  const applied = new Set(
    (db.prepare('SELECT version FROM _migrations').all() as { version: number }[]).map(
      (row) => row.version
    )
  )

  const applyMigration = db.transaction((migration: Migration) => {
    migration.up(db)
    db.prepare('INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)').run(
      migration.version,
      migration.name,
      new Date().toISOString()
    )
  })

  for (const migration of MIGRATIONS) {
    if (!applied.has(migration.version)) applyMigration(migration)
  }
}
