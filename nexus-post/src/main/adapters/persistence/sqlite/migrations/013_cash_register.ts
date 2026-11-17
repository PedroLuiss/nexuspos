import type Database from 'better-sqlite3'
import type { Migration } from './index'

export const migration013CashRegister: Migration = {
  version: 13,
  name: 'cash_register',
  up(db: Database.Database): void {
    db.exec(`
      CREATE TABLE cash_shifts (
        id TEXT PRIMARY KEY,
        cashier_id TEXT NOT NULL,
        cashier_name TEXT NOT NULL,
        opened_at TEXT NOT NULL,
        opening_amount REAL NOT NULL CHECK (opening_amount >= 0),
        closed_at TEXT,
        expected_cash REAL,
        counted_cash REAL,
        difference REAL
      );

      CREATE UNIQUE INDEX idx_cash_shifts_one_open_per_cashier
        ON cash_shifts(cashier_id) WHERE closed_at IS NULL;
      CREATE INDEX idx_cash_shifts_cashier_opened
        ON cash_shifts(cashier_id, opened_at DESC);

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
      CREATE INDEX idx_cash_movements_shift ON cash_movements(shift_id, created_at DESC);

      CREATE TABLE sale_refunds (
        id TEXT PRIMARY KEY,
        sale_id TEXT NOT NULL UNIQUE REFERENCES sales(id),
        cash_shift_id TEXT NOT NULL REFERENCES cash_shifts(id),
        cashier_id TEXT NOT NULL,
        returned_at TEXT NOT NULL,
        amount REAL NOT NULL CHECK (amount > 0),
        payment_json TEXT NOT NULL,
        cash_amount REAL NOT NULL DEFAULT 0
      );
      CREATE INDEX idx_sale_refunds_shift ON sale_refunds(cash_shift_id, returned_at DESC);
    `)

    db.exec(`
      ALTER TABLE sales ADD COLUMN cash_shift_id TEXT REFERENCES cash_shifts(id);
      ALTER TABLE sales ADD COLUMN returned_at TEXT;
      ALTER TABLE sales ADD COLUMN return_payment_json TEXT;
      ALTER TABLE sales ADD COLUMN return_cash_amount REAL NOT NULL DEFAULT 0;
      ALTER TABLE sale_items ADD COLUMN unit_cost REAL NOT NULL DEFAULT 0;
      ALTER TABLE customer_payments ADD COLUMN cash_shift_id TEXT REFERENCES cash_shifts(id);
      ALTER TABLE customers ADD COLUMN credit_balance REAL NOT NULL DEFAULT 0;
      ALTER TABLE suspended_sales ADD COLUMN cashier_id TEXT;
      CREATE INDEX idx_sales_cash_shift ON sales(cash_shift_id, sold_at DESC);
      CREATE INDEX idx_suspended_sales_cashier ON suspended_sales(cashier_id, created_at DESC);
    `)

    const cashierRows = db
      .prepare("SELECT id, permissions FROM users WHERE role = 'CASHIER'")
      .all() as Array<{ id: string; permissions: string | null }>
    const updatePermissions = db.prepare('UPDATE users SET permissions = ? WHERE id = ?')
    for (const row of cashierRows) {
      const permissions = row.permissions ? (JSON.parse(row.permissions) as unknown) : []
      if (!Array.isArray(permissions)) {
        throw new Error(`Permisos inválidos para el usuario cajero ${row.id}.`)
      }
      if (!permissions.includes('CAN_MANUAL_CASH_MOVEMENTS')) {
        updatePermissions.run(JSON.stringify([...permissions, 'CAN_MANUAL_CASH_MOVEMENTS']), row.id)
      }
    }
  }
}
