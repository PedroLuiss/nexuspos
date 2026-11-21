import { CORE_PRODUCT_TYPES } from '@shared/contracts'
import type Database from 'better-sqlite3'
import type { Migration } from './index'

export const migration028RestoreCoreProductTypes: Migration = {
  version: 28,
  name: 'restore_core_product_types',
  up(db: Database.Database): void {
    const now = new Date().toISOString()
    const restoreType = db.prepare(`
      INSERT INTO product_types (
        id, name, kind, track_stock, active, deleted, created_at, updated_at
      ) VALUES (
        @id, @name, @kind, @trackStock, 1, 0, @createdAt, @updatedAt
      )
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        kind = excluded.kind,
        track_stock = excluded.track_stock,
        active = 1,
        deleted = 0,
        updated_at = excluded.updated_at
    `)

    for (const type of CORE_PRODUCT_TYPES) {
      const conflictingTypes = db
        .prepare('SELECT id FROM product_types WHERE id <> ? AND name = ? COLLATE NOCASE')
        .all(type.id, type.name) as { id: string }[]

      for (const conflictingType of conflictingTypes) {
        let suffix = 1
        let customName = `${type.name} (Personalizado)`
        while (
          db.prepare('SELECT 1 FROM product_types WHERE name = ? COLLATE NOCASE').get(customName)
        ) {
          suffix += 1
          customName = `${type.name} (Personalizado ${suffix})`
        }
        db.prepare('UPDATE product_types SET name = ?, updated_at = ? WHERE id = ?').run(
          customName,
          now,
          conflictingType.id
        )
      }

      restoreType.run({
        ...type,
        trackStock: type.trackStock ? 1 : 0,
        createdAt: now,
        updatedAt: now
      })
    }

    db.prepare(
      `
      UPDATE product_types
      SET kind = 'simple', track_stock = 1, updated_at = ?
      WHERE id NOT IN (?, ?, ?, ?)
        AND (kind <> 'simple' OR track_stock <> 1)
    `
    ).run(now, ...CORE_PRODUCT_TYPES.map((type) => type.id))
  }
}
