import type Database from 'better-sqlite3'
import type { Migration } from './index'

export const migration023ProductListIndexes: Migration = {
  version: 23,
  name: 'product_list_indexes',
  up(db: Database.Database): void {
    db.exec(`
      CREATE INDEX idx_products_live_name
        ON products(name COLLATE NOCASE)
        WHERE deleted = 0;
      CREATE INDEX idx_products_live_category_name
        ON products(category, name COLLATE NOCASE)
        WHERE deleted = 0;
    `)
  }
}
