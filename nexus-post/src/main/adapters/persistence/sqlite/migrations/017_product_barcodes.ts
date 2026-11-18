import type Database from 'better-sqlite3'
import type { Migration } from './index'

/**
 * Códigos de barras múltiples por producto.
 *
 * - `product_barcodes`: varios códigos de barras por producto (EAN-13, Code128, etc.).
 * - `products.barcode` (columna legada en products) se conserva para retrocompatibilidad;
 *   el código principal ahora vive aquí con `isPrimary = 1`.
 *
 * Cada código de barras es único en la tabla para evitar duplicados.
 */
export const migration017ProductBarcodes: Migration = {
  version: 17,
  name: 'product_barcodes',
  up(db: Database.Database): void {
    const now = new Date().toISOString()

    db.exec(`
      CREATE TABLE product_barcodes (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id),
        barcode TEXT NOT NULL,
        format TEXT NOT NULL DEFAULT 'EAN-13',
        label TEXT NOT NULL DEFAULT '',
        is_primary INTEGER NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX idx_product_barcodes_product ON product_barcodes(product_id);
      CREATE UNIQUE INDEX idx_product_barcodes_barcode_unique ON product_barcodes(barcode) WHERE deleted = 0;
      CREATE UNIQUE INDEX idx_product_barcodes_primary_unique ON product_barcodes(product_id) WHERE is_primary = 1 AND deleted = 0;
    `)

    // Migrar el código de barras legacy de products.barcode si existe (migración 001 no lo tiene,
    // pero lo dejamos preparado por si se agregó en una versión intermedia).
    const hasBarcodeCol = db
      .prepare("PRAGMA table_info(products)")
      .all() as { name: string }[]
    if (hasBarcodeCol.some((c) => c.name === 'barcode')) {
      db.prepare(`
        INSERT INTO product_barcodes (id, product_id, barcode, format, label, is_primary, active, deleted, created_at, updated_at)
        SELECT
          'bc-' || id,
          id,
          barcode,
          'EAN-13',
          'Principal',
          1,
          active,
          deleted,
          created_at,
          updated_at
        FROM products
        WHERE barcode IS NOT NULL AND barcode <> ''
      `).run()
    }

    // Semilla de ejemplo para productos demo (solo si existen productos)
    const productCount = (db
      .prepare('SELECT COUNT(*) AS total FROM products WHERE deleted = 0')
      .get() as { total: number }).total
    if (productCount > 0) {
      const firstProduct = db
        .prepare("SELECT id FROM products WHERE deleted = 0 LIMIT 1")
        .get() as { id: string }
      db.prepare(`
        INSERT INTO product_barcodes (id, product_id, barcode, format, label, is_primary, active, deleted, created_at, updated_at)
        VALUES (@id, @productId, @barcode, @format, @label, @isPrimary, 1, 0, @now, @now)
      `).run({
        id: `bc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        productId: firstProduct.id,
        barcode: '7501000000015',
        format: 'EAN-13',
        label: 'Código principal',
        isPrimary: 1,
        now
      })
    }
  }
}
