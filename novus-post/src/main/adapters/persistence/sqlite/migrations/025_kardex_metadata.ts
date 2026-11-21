import type Database from 'better-sqlite3'

export const migration025KardexMetadata = {
  version: 25,
  name: 'kardex_metadata',
  up(db: Database.Database): void {
    db.exec(`
      ALTER TABLE stock_movements ADD COLUMN source TEXT NOT NULL DEFAULT 'LEGACY';
      ALTER TABLE stock_movements ADD COLUMN unit TEXT;
      ALTER TABLE stock_movements ADD COLUMN reference TEXT;
      ALTER TABLE stock_movements ADD COLUMN batch_number TEXT;
      ALTER TABLE stock_movements ADD COLUMN unit_cost REAL;
      ALTER TABLE stock_movements ADD COLUMN valuation_basis TEXT;
      CREATE INDEX IF NOT EXISTS idx_stock_movements_reference
        ON stock_movements(reference, product_id, source, type, created_at DESC, id DESC);
      CREATE INDEX IF NOT EXISTS idx_stock_movements_created_id
        ON stock_movements(created_at DESC, id DESC);
    `)
  }
}
