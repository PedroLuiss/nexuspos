import type Database from 'better-sqlite3'
import type { Migration } from './index'

export const migration027CashStation: Migration = {
  version: 27,
  name: 'cash_station',
  up(db: Database.Database): void {
    db.exec(`
      ALTER TABLE cash_shifts ADD COLUMN station_name TEXT NOT NULL DEFAULT 'CAJA-01';
      UPDATE cash_shifts
      SET station_name = COALESCE(
        (SELECT NULLIF(TRIM(users.station), '') FROM users WHERE users.id = cash_shifts.cashier_id),
        'CAJA-01'
      );
    `)
  }
}
