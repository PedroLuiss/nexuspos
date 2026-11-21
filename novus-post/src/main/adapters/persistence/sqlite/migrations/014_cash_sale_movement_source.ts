import type Database from 'better-sqlite3'
import type { Migration } from './index'

export const migration014CashSaleMovementSource: Migration = {
  version: 14,
  name: 'cash_sale_movement_source',
  up(db: Database.Database): void {
    const table = db
      .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'cash_movements'")
      .get() as { sql: string } | undefined
    if (!table || table.sql.includes("'SALE'")) return

    db.exec(`
      DROP INDEX IF EXISTS idx_cash_movements_shift;
      ALTER TABLE cash_movements RENAME TO cash_movements_legacy;
      CREATE TABLE cash_movements (
        id TEXT PRIMARY KEY,
        shift_id TEXT NOT NULL REFERENCES cash_shifts(id),
        created_at TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('INGRESO', 'EGRESO', 'DEVOLUCION')),
        amount REAL NOT NULL CHECK (amount > 0),
        cash_effect REAL NOT NULL,
        concept TEXT NOT NULL,
        cashier_name TEXT NOT NULL,
        source TEXT NOT NULL CHECK (source IN ('MANUAL', 'SALE', 'CUSTOMER_PAYMENT', 'SALE_REFUND')),
        payment_method TEXT,
        source_id TEXT
      );
      INSERT INTO cash_movements (
        id, shift_id, created_at, type, amount, cash_effect, concept,
        cashier_name, source, payment_method, source_id
      )
      SELECT
        id, shift_id, created_at, type, amount, cash_effect, concept,
        cashier_name, source, payment_method, source_id
      FROM cash_movements_legacy;
      DROP TABLE cash_movements_legacy;
      CREATE INDEX idx_cash_movements_shift ON cash_movements(shift_id, created_at DESC);
    `)
  }
}
