import type Database from 'better-sqlite3'
import type { Migration } from './index'

/**
 * Trazabilidad de devoluciones (migración 022).
 *
 * Hasta ahora `sale_items` no guardaba qué lotes se consumieron ni si la línea
 * era un combo, por lo que `CashService.returnSale()` reponía stock sobre el
 * producto equivocado (el combo en vez de sus componentes) y no reponía lotes.
 *
 * - `is_combo` / `combo_id`: identifica líneas de bundle para reponer componentes.
 * - `batches_json`: JSON con [{ batchId, batchNumber, productId, quantity }] de
 *   los lotes FEFO descontados, para reponer exactamente esos lotes al devolver.
 */
export const migration022SaleItemTraceability: Migration = {
  version: 22,
  name: 'sale_item_traceability',
  up(db: Database.Database): void {
    db.exec(`
      ALTER TABLE sale_items ADD COLUMN is_combo INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE sale_items ADD COLUMN combo_id TEXT;
      ALTER TABLE sale_items ADD COLUMN batches_json TEXT NOT NULL DEFAULT '';

      CREATE INDEX idx_sale_items_combo ON sale_items(combo_id);
    `)
  }
}
