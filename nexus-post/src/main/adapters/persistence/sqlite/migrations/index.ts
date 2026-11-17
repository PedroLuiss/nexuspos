import type Database from 'better-sqlite3'

export interface Migration {
  version: number
  name: string
  up: (db: Database.Database) => void
}

import { migration001Products } from './001_products'
import { migration002StockMovements } from './002_stock_movements'
import { migration003Categories } from './003_categories'
import { migration004Users } from './004_users'
import { migration005ProductImages } from './005_product_images'
import { migration006SeedProducts } from './006_seed_products'
import { migration007UserPermissions } from './007_user_permissions'
import { migration008BusinessSettings } from './008_business_settings'
import { migration009BusinessSettingsColumns } from './009_business_settings_columns'
import { migration010ScaleConfig } from './010_scale_config'
import { migration011Customers } from './011_customers'
import { migration012SalesExchangeRates } from './012_sales_exchange_rates'

const MIGRATIONS: Migration[] = [
  migration001Products,
  migration002StockMovements,
  migration003Categories,
  migration004Users,
  migration005ProductImages,
  migration006SeedProducts,
  migration007UserPermissions,
  migration008BusinessSettings,
  migration009BusinessSettingsColumns,
  migration010ScaleConfig,
  migration011Customers,
  migration012SalesExchangeRates
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
