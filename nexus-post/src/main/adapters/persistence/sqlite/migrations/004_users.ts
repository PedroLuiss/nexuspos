import type Database from 'better-sqlite3'
import type { Migration } from './index'

export const migration004Users: Migration = {
  version: 4,
  name: 'users',
  up(db: Database.Database): void {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        pin TEXT,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'CASHIER',
        active INTEGER NOT NULL DEFAULT 1,
        branch TEXT,
        station TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_pin ON users(pin);
    `)

    // Seed default operator and admin
    const now = new Date().toISOString()
    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO users (id, username, email, password_hash, pin, name, role, active, branch, station, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `)

    insertStmt.run(
      'usr-cajero-01',
      'cajero.central',
      'cajero.central@nexuspos.pe',
      'SecurityKey#2026',
      '1234',
      'Carlos Morales',
      'CASHIER',
      'Sucursal Central - Javier Prado',
      'CAJA-01',
      now,
      now
    )

    insertStmt.run(
      'usr-admin-01',
      'admin',
      'admin@nexuspos.pe',
      'Admin#2026',
      '9999',
      'Admin Sistema',
      'ADMIN',
      'Sucursal Central - Javier Prado',
      'TERMINAL-00',
      now,
      now
    )
  }
}
