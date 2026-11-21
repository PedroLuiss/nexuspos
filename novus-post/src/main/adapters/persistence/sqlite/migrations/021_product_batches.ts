import type Database from 'better-sqlite3'
import type { Migration } from './index'

/**
 * Lotes y caducidad de productos.
 *
 * - `product_batches`: entradas de mercancía con nº de lote, cantidad y fecha de vencimiento.
 * - `products.track_batches`: si el producto controla stock por lotes.
 * - El stock de un producto con lotes se deriva de la suma de sus lotes activos
 *   (ver `products.sqlite.ts`). Las salidas descuentan FEFO (First Expired, First Out).
 *
 * Al activar `track_batches` en un producto con stock existente, se crea un lote
 * inicial con ese stock (sin vencimiento) para no perder el inventario actual.
 */
export const migration021ProductBatches: Migration = {
  version: 21,
  name: 'product_batches',
  up(db: Database.Database): void {
    const now = new Date().toISOString()

    db.exec(`
      CREATE TABLE product_batches (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id),
        batch_number TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 0,
        expiration_date TEXT,
        entered_at TEXT NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      ALTER TABLE products ADD COLUMN track_batches INTEGER NOT NULL DEFAULT 0;

      CREATE INDEX idx_product_batches_product ON product_batches(product_id);
      CREATE INDEX idx_product_batches_expiry ON product_batches(expiration_date);
    `)

    // Los productos con stock se dejan sin control de lotes por defecto (track_batches = 0),
    // de modo que su stock sigue siendo el almacenado. El usuario puede activar el control
    // de lotes desde el formulario; el backend creará el lote inicial con el stock actual.
    void now
  }
}
