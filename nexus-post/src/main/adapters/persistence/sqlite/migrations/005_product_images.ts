import type Database from 'better-sqlite3'
import type { Migration } from './index'

export const migration005ProductImages: Migration = {
  version: 5,
  name: 'product_images',
  up(db: Database.Database): void {
    const tableInfo = db.prepare("PRAGMA table_info('products')").all() as Array<{ name: string }>
    const hasColumn = tableInfo.some((col) => col.name === 'image_url')

    if (!hasColumn) {
      db.exec(`
        ALTER TABLE products ADD COLUMN image_url TEXT DEFAULT '';
      `)
    }
  }
}
