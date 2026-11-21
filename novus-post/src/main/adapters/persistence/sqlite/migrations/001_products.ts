import type Database from 'better-sqlite3'
import type { Migration } from './index'

export const migration001Products: Migration = {
  version: 1,
  name: 'products',
  up(db: Database.Database): void {
    db.exec(`
      CREATE TABLE products (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT '',
        cost_price REAL NOT NULL DEFAULT 0,
        sale_price REAL NOT NULL DEFAULT 0,
        stock REAL NOT NULL DEFAULT 0,
        min_stock REAL NOT NULL DEFAULT 0,
        max_stock REAL,
        unit TEXT NOT NULL DEFAULT 'Pieza (pza)',
        has_tax INTEGER NOT NULL DEFAULT 1,
        active INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        description TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX idx_products_code ON products(code);
      CREATE INDEX idx_products_active ON products(active, deleted);
    `)
  }
}
