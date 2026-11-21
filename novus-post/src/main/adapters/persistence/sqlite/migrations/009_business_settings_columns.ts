import type Database from 'better-sqlite3'
import type { Migration } from './index'

/**
 * Migración 009: Agrega columnas faltantes a business_settings para soporte
 * de domicilio fiscal completo en Venezuela (municipio, parroquia).
 *
 * Esta migración es idempotente: solo agrega columnas que no existan, por lo
 * que es segura para ejecutar sobre bases de datos ya creadas con la migración 008.
 */
export const migration009BusinessSettingsColumns: Migration = {
  version: 9,
  name: 'business_settings_columns',
  up(db: Database.Database): void {
    const existingColumns = new Set(
      (db.prepare('PRAGMA table_info(business_settings)').all() as { name: string }[]).map(
        (c) => c.name
      )
    )

    const alterStatements: string[] = []
    if (!existingColumns.has('municipality')) {
      alterStatements.push(
        "ALTER TABLE business_settings ADD COLUMN municipality TEXT NOT NULL DEFAULT ''"
      )
    }
    if (!existingColumns.has('parish')) {
      alterStatements.push(
        "ALTER TABLE business_settings ADD COLUMN parish TEXT NOT NULL DEFAULT ''"
      )
    }
    if (!existingColumns.has('country')) {
      alterStatements.push(
        "ALTER TABLE business_settings ADD COLUMN country TEXT NOT NULL DEFAULT 'Venezuela'"
      )
    }
    if (!existingColumns.has('currency')) {
      alterStatements.push(
        "ALTER TABLE business_settings ADD COLUMN currency TEXT NOT NULL DEFAULT 'VES'"
      )
    }
    if (!existingColumns.has('tax_id_type')) {
      alterStatements.push(
        "ALTER TABLE business_settings ADD COLUMN tax_id_type TEXT NOT NULL DEFAULT 'RIF'"
      )
    }
    if (!existingColumns.has('tax_regime')) {
      alterStatements.push(
        "ALTER TABLE business_settings ADD COLUMN tax_regime TEXT NOT NULL DEFAULT ''"
      )
    }
    if (!existingColumns.has('owner_tax_id')) {
      alterStatements.push(
        "ALTER TABLE business_settings ADD COLUMN owner_tax_id TEXT NOT NULL DEFAULT ''"
      )
    }
    if (!existingColumns.has('mobile')) {
      alterStatements.push(
        "ALTER TABLE business_settings ADD COLUMN mobile TEXT NOT NULL DEFAULT ''"
      )
    }
    if (!existingColumns.has('website')) {
      alterStatements.push(
        "ALTER TABLE business_settings ADD COLUMN website TEXT NOT NULL DEFAULT ''"
      )
    }
    if (!existingColumns.has('district')) {
      alterStatements.push(
        "ALTER TABLE business_settings ADD COLUMN district TEXT NOT NULL DEFAULT ''"
      )
    }
    if (!existingColumns.has('ticket_header')) {
      alterStatements.push(
        "ALTER TABLE business_settings ADD COLUMN ticket_header TEXT NOT NULL DEFAULT ''"
      )
    }
    if (!existingColumns.has('ticket_footer')) {
      alterStatements.push(
        "ALTER TABLE business_settings ADD COLUMN ticket_footer TEXT NOT NULL DEFAULT ''"
      )
    }
    if (!existingColumns.has('ticket_legal_note')) {
      alterStatements.push(
        "ALTER TABLE business_settings ADD COLUMN ticket_legal_note TEXT NOT NULL DEFAULT ''"
      )
    }
    if (!existingColumns.has('ticket_show_tax_id')) {
      alterStatements.push(
        'ALTER TABLE business_settings ADD COLUMN ticket_show_tax_id INTEGER NOT NULL DEFAULT 1'
      )
    }
    if (!existingColumns.has('ticket_show_address')) {
      alterStatements.push(
        'ALTER TABLE business_settings ADD COLUMN ticket_show_address INTEGER NOT NULL DEFAULT 1'
      )
    }
    if (!existingColumns.has('ticket_show_cashier')) {
      alterStatements.push(
        'ALTER TABLE business_settings ADD COLUMN ticket_show_cashier INTEGER NOT NULL DEFAULT 1'
      )
    }
    if (!existingColumns.has('tax_enabled')) {
      alterStatements.push(
        'ALTER TABLE business_settings ADD COLUMN tax_enabled INTEGER NOT NULL DEFAULT 1'
      )
    }
    if (!existingColumns.has('tax_name')) {
      alterStatements.push(
        "ALTER TABLE business_settings ADD COLUMN tax_name TEXT NOT NULL DEFAULT 'IVA'"
      )
    }
    if (!existingColumns.has('tax_rate')) {
      alterStatements.push(
        'ALTER TABLE business_settings ADD COLUMN tax_rate REAL NOT NULL DEFAULT 16'
      )
    }
    if (!existingColumns.has('prices_include_tax')) {
      alterStatements.push(
        'ALTER TABLE business_settings ADD COLUMN prices_include_tax INTEGER NOT NULL DEFAULT 0'
      )
    }
    if (!existingColumns.has('created_at')) {
      alterStatements.push(
        "ALTER TABLE business_settings ADD COLUMN created_at TEXT NOT NULL DEFAULT ''"
      )
    }
    if (!existingColumns.has('updated_at')) {
      alterStatements.push(
        "ALTER TABLE business_settings ADD COLUMN updated_at TEXT NOT NULL DEFAULT ''"
      )
    }
    if (!existingColumns.has('updated_by')) {
      alterStatements.push(
        "ALTER TABLE business_settings ADD COLUMN updated_by TEXT NOT NULL DEFAULT ''"
      )
    }

    for (const stmt of alterStatements) {
      db.exec(stmt)
    }
  }
}
