import type Database from 'better-sqlite3'
import type { Migration } from './index'

/**
 * Catálogo multi-tasa de impuestos.
 *
 * - `taxes`: tasas disponibles (exento, general, reducida, adicional…).
 * - `products.tax_id`: tasa asignada a cada producto (reemplaza `has_tax`).
 * - `sale_taxes`: desglose fiscal por venta (una fila por tasa aplicada).
 *
 * `products.has_tax` y `sales.tax` se conservan como columnas legadas para no
 * romper reportes ni tickets históricos; el backfill migra los datos existentes.
 */
export const migration015Taxes: Migration = {
  version: 15,
  name: 'taxes',
  up(db: Database.Database): void {
    const now = new Date().toISOString()

    db.exec(`
      CREATE TABLE taxes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        rate REAL NOT NULL DEFAULT 0,
        code TEXT NOT NULL DEFAULT '',
        is_default INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX idx_taxes_active ON taxes(active, deleted);
      CREATE UNIQUE INDEX idx_taxes_name_unique ON taxes(name COLLATE NOCASE) WHERE deleted = 0;
      CREATE UNIQUE INDEX idx_taxes_default_unique ON taxes(is_default) WHERE is_default = 1 AND deleted = 0;
    `)

    const insertTax = db.prepare(`
      INSERT INTO taxes (id, name, rate, code, is_default, active, deleted, created_at, updated_at)
      VALUES (@id, @name, @rate, @code, @isDefault, 1, 0, @now, @now)
    `)

    insertTax.run({ id: 'tax-exento', name: 'Exento', rate: 0, code: 'E', isDefault: 0, now })
    insertTax.run({
      id: 'tax-iva-general',
      name: 'IVA General',
      rate: 16,
      code: 'G',
      isDefault: 1,
      now
    })
    insertTax.run({
      id: 'tax-iva-reducido',
      name: 'IVA Reducido',
      rate: 8,
      code: 'R',
      isDefault: 0,
      now
    })
    insertTax.run({
      id: 'tax-iva-adicional',
      name: 'IVA Adicional',
      rate: 31,
      code: 'A',
      isDefault: 0,
      now
    })

    db.exec(`
      ALTER TABLE products ADD COLUMN tax_id TEXT REFERENCES taxes(id);
      CREATE INDEX idx_products_tax ON products(tax_id);
    `)

    // Backfill: los productos gravados pasan a la tasa por defecto y los
    // marcados como exentos al 0%. Cualquier fila sin marca queda gravada.
    db.exec(`
      UPDATE products SET tax_id = 'tax-iva-general' WHERE has_tax = 1;
      UPDATE products SET tax_id = 'tax-exento' WHERE has_tax = 0;
      UPDATE products SET tax_id = 'tax-iva-general' WHERE tax_id IS NULL;
    `)

    db.exec(`
      CREATE TABLE sale_taxes (
        id TEXT PRIMARY KEY,
        sale_id TEXT NOT NULL REFERENCES sales(id),
        tax_id TEXT,
        tax_name TEXT NOT NULL,
        tax_rate REAL NOT NULL,
        taxable_base REAL NOT NULL,
        amount REAL NOT NULL
      );

      CREATE INDEX idx_sale_taxes_sale ON sale_taxes(sale_id);
    `)
  }
}
