import type Database from 'better-sqlite3'
import type { Migration } from './index'

/**
 * Componentes de combo (bundle real).
 *
 * - `combo_items`: un producto de tipo `combo` se compone de otros productos.
 * - Al vender el combo se cobra su precio y el stock se descuenta de cada
 *   componente (movimientos Kardex con reason 'COMBO'), no del combo directamente.
 * - El stock disponible del combo se deriva de sus componentes en `products.sqlite.ts`.
 *
 * Reglas: un componente no puede ser el propio combo, no se permiten combos
 * anidados (un combo dentro de otro) y la combinación combo+componente es única.
 */
export const migration019ComboItems: Migration = {
  version: 19,
  name: 'combo_items',
  up(db: Database.Database): void {
    db.exec(`
      CREATE TABLE combo_items (
        id TEXT PRIMARY KEY,
        combo_id TEXT NOT NULL REFERENCES products(id),
        component_id TEXT NOT NULL REFERENCES products(id),
        quantity REAL NOT NULL DEFAULT 1,
        active INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX idx_combo_items_combo ON combo_items(combo_id);
      CREATE INDEX idx_combo_items_component ON combo_items(component_id);
      CREATE UNIQUE INDEX idx_combo_items_unique ON combo_items(combo_id, component_id) WHERE deleted = 0;
    `)
  }
}
