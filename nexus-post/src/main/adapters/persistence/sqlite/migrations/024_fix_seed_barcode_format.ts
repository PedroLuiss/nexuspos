import type Database from 'better-sqlite3'
import type { Migration } from './index'

export const migration024FixSeedBarcodeFormat: Migration = {
  version: 24,
  name: 'fix_seed_barcode_format',
  up(db: Database.Database): void {
    db.prepare(`
      UPDATE product_barcodes
      SET format = 'Code128', updated_at = ?
      WHERE barcode = '7501000000015'
        AND format = 'EAN-13'
        AND label = 'Código principal'
        AND is_primary = 1
        AND active = 1
        AND deleted = 0
    `).run(new Date().toISOString())
  }
}
