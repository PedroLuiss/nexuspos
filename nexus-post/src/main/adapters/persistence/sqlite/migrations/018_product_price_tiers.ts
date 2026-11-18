import type Database from 'better-sqlite3'
import type { Migration } from './index'

/**
 * Precios por mayoreo (price tiers) por producto.
 *
 * - `product_price_tiers`: escalas de cantidad con precios diferentes por producto.
 *   Ejemplo: min_quantity=10, max_quantity=49, price=90 → al vender 10-49 unidades
 *   el precio unitario es $90 en lugar del precio estándar.
 *
 * Cuando se vende, `sales.service` / POS resuelven el precio aplicable según la
 * cantidad del carrito. Los tiers se validan para que no se solapen por producto.
 */
export const migration018ProductPriceTiers: Migration = {
  version: 18,
  name: 'product_price_tiers',
  up(db: Database.Database): void {
    const now = new Date().toISOString()

    db.exec(`
      CREATE TABLE product_price_tiers (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id),
        min_quantity REAL NOT NULL,
        max_quantity REAL,
        price REAL NOT NULL,
        active INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX idx_product_price_tiers_product ON product_price_tiers(product_id);
      CREATE INDEX idx_product_price_tiers_active ON product_price_tiers(product_id, active, deleted);
    `)

    // Semilla de ejemplo para productos demo con precio de venta > 0.
    // Tier: 10-49 unidades al 10% de descuento sobre el precio de venta.
    const products = db
      .prepare(
        'SELECT id, sale_price FROM products WHERE deleted = 0 AND sale_price > 0 LIMIT 5'
      )
      .all() as { id: string; sale_price: number }[]

    for (const p of products) {
      const tierPrice = Number((p.sale_price * 0.9).toFixed(2))
      db.prepare(`
        INSERT INTO product_price_tiers (id, product_id, min_quantity, max_quantity, price, active, deleted, created_at, updated_at)
        VALUES (@id, @productId, @minQty, @maxQty, @price, 1, 0, @now, @now)
      `).run({
        id: `tier-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        productId: p.id,
        minQty: 10,
        maxQty: 49,
        price: tierPrice,
        now
      })
    }
  }
}
