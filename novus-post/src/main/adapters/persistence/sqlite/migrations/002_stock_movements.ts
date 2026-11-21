import type Database from 'better-sqlite3'
import type { Migration } from './index'

export const migration002StockMovements: Migration = {
  version: 2,
  name: 'stock_movements',
  up(db: Database.Database): void {
    db.exec(
      `CREATE TABLE stock_movements (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL REFERENCES products(id),
        product_name TEXT NOT NULL,
        product_code TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('ENTRADA', 'SALIDA')),
        reason TEXT NOT NULL,
        previous_stock REAL NOT NULL,
        quantity REAL NOT NULL,
        new_stock REAL NOT NULL,
        notes TEXT,
        responsible_user TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE INDEX idx_stock_movements_product ON stock_movements(product_id, created_at);
      CREATE INDEX idx_stock_movements_created ON stock_movements(created_at);`
    )
  }
}
