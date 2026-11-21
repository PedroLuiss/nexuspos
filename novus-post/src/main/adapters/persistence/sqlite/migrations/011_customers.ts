import type Database from 'better-sqlite3'
import type { Migration } from './index'

/**
 * Migración 011: Tablas de clientes, deudas y pagos (crédito/cobranza).
 *
 * - `customers`: Directorio de clientes con límite de crédito y deuda actual.
 * - `customer_debts`: Tickets con saldo pendiente (deudas por cliente).
 * - `customer_payments`: Abonos/pagos realizados a la cuenta de un cliente.
 */
export const migration011Customers: Migration = {
  version: 11,
  name: 'customers',
  up(db: Database.Database): void {
    // ── Tabla de clientes ──
    db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        tax_id TEXT NOT NULL DEFAULT '',
        phone TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL DEFAULT '',
        address TEXT NOT NULL DEFAULT '',
        credit_limit REAL NOT NULL DEFAULT 0,
        current_debt REAL NOT NULL DEFAULT 0,
        active INTEGER NOT NULL DEFAULT 1,
        deleted INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `)

    // ── Tabla de deudas (tickets con saldo pendiente) ──
    db.exec(`
      CREATE TABLE IF NOT EXISTS customer_debts (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        ticket_number TEXT NOT NULL,
        date TEXT NOT NULL,
        total_amount REAL NOT NULL,
        balance REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      );
    `)

    // ── Tabla de pagos / abonos ──
    db.exec(`
      CREATE TABLE IF NOT EXISTS customer_payments (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        date TEXT NOT NULL,
        amount REAL NOT NULL,
        concept TEXT NOT NULL DEFAULT '',
        cashier_name TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
      );
    `)

    // Índices para búsquedas frecuentes
    db.exec(`CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(code)`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(active)`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_customer_debts_customer ON customer_debts(customer_id)`)
    db.exec(`CREATE INDEX IF NOT EXISTS idx_customer_debts_status ON customer_debts(status)`)
    db.exec(
      `CREATE INDEX IF NOT EXISTS idx_customer_payments_customer ON customer_payments(customer_id)`
    )

    // Semilla de clientes demostrativos
    const now = new Date().toISOString()
    const insert = db.prepare(`
      INSERT OR IGNORE INTO customers (
        id, code, name, tax_id, phone, email, address,
        credit_limit, current_debt, active, deleted, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `)

    insert.run(
      'cust-001',
      'CLI-001',
      'Distribuidora del Norte S.A.',
      'XAXX010101000',
      '55-1234-5678',
      'ventas@norte.com',
      'Av. Siempre Viva 123, Col. Centro',
      5000,
      0,
      1,
      0,
      now,
      now
    )

    insert.run(
      'cust-002',
      'CLI-002',
      'Juan Pérez Rodríguez',
      'V-12345678',
      '55-8765-4321',
      'juan.perez@email.com',
      'Calle Libertad 456, Col. Reforma',
      3000,
      0,
      1,
      0,
      now,
      now
    )

    insert.run(
      'cust-003',
      'CLI-003',
      'Comercial Sur C.A.',
      'J-00000000-0',
      '55-2222-3333',
      'contacto@sur.com',
      'Av. Principal 789, Col. Sur',
      10000,
      2500,
      1,
      0,
      now,
      now
    )

    // Semilla de deuda para el cliente 3
    const debtInsert = db.prepare(`
      INSERT OR IGNORE INTO customer_debts (
        id, customer_id, ticket_number, date, total_amount, balance, status, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?
      )
    `)

    debtInsert.run('debt-001', 'cust-003', 'TKT-000123', now, 3000, 2500, 'PENDING', now)

    // Semilla de pago para el cliente 3
    const paymentInsert = db.prepare(`
      INSERT OR IGNORE INTO customer_payments (
        id, customer_id, date, amount, concept, cashier_name, created_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?
      )
    `)

    paymentInsert.run('pay-001', 'cust-003', now, 500, 'Abono parcial', 'Administrador', now)
  }
}
