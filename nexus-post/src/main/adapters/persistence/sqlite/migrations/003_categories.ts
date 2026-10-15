import type Database from 'better-sqlite3'
import type { Migration } from './index'

/** Categorías iniciales (seed del catálogo operativo actual). */
const SEED_CATEGORIES = [
  { name: 'Bebidas y Refrescos', description: 'Bebidas, jugos, aguas y refrescos' },
  { name: 'Alimentos y Abarrotes', description: 'Abarrotes, conservas y alimentos en general' },
  { name: 'Lácteos y Quesos', description: 'Leche, yogures, quesos y derivados' },
  { name: 'Limpieza y Hogar', description: 'Productos de limpieza y artículos para el hogar' },
  { name: 'Snacks y Golosinas', description: 'Botanas, dulces y golosinas' },
  { name: 'Cuidado Personal', description: 'Higiene y cuidado personal' },
  { name: 'Farmacia y Salud', description: 'Productos farmacéuticos y de salud' }
]

export const migration003Categories: Migration = {
  version: 3,
  name: 'categories',
  up(db: Database.Database): void {
    db.exec(
      `CREATE TABLE categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE,
        description TEXT,
        active INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX idx_categories_name ON categories(name);`
    )

    const insert = db.prepare(
      `INSERT INTO categories (id, name, description, active, deleted, created_at, updated_at)
       VALUES (@id, @name, @description, 1, 0, @createdAt, @updatedAt)`
    )

    const now = new Date().toISOString()
    const seed = db.transaction((rows: typeof SEED_CATEGORIES) => {
      rows.forEach((row, index) => {
        insert.run({
          id: `cat-seed-${String(index + 1).padStart(3, '0')}`,
          name: row.name,
          description: row.description,
          createdAt: now,
          updatedAt: now
        })
      })
    })

    const existing = db.prepare('SELECT COUNT(*) AS total FROM categories').get() as {
      total: number
    }
    if (existing.total === 0) seed(SEED_CATEGORIES)
  }
}
