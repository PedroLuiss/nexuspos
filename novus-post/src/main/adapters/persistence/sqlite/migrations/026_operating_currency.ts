import type Database from 'better-sqlite3'
import type { Migration } from './index'

export const migration026OperatingCurrency: Migration = {
  version: 26,
  name: 'operating_currency',
  up(db: Database.Database): void {
    db.exec(`
      ALTER TABLE sales ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';
      ALTER TABLE cash_shifts ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';
      ALTER TABLE cash_movements ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';
      ALTER TABLE customers ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';
      ALTER TABLE customer_debts ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';
      ALTER TABLE customer_payments ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';
      ALTER TABLE stock_movements ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';

      CREATE TABLE currency_exchange_rates (
        id TEXT PRIMARY KEY,
        currency TEXT NOT NULL CHECK (currency IN ('USD', 'EUR')),
        rate REAL NOT NULL CHECK (rate > 0),
        updated_at TEXT NOT NULL
      );

      CREATE TABLE currency_change_log (
        id TEXT PRIMARY KEY,
        from_currency TEXT NOT NULL,
        to_currency TEXT NOT NULL,
        from_rate_to_ves REAL NOT NULL CHECK (from_rate_to_ves > 0),
        to_rate_to_ves REAL NOT NULL CHECK (to_rate_to_ves > 0),
        multiplier REAL NOT NULL CHECK (multiplier > 0),
        changed_at TEXT NOT NULL,
        changed_by TEXT NOT NULL
      );
    `)
  }
}
