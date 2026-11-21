import type Database from 'better-sqlite3'
import type { Migration } from './index'

export const migration012SalesExchangeRates: Migration = {
  version: 12,
  name: 'sales_exchange_rates',
  up(db: Database.Database): void {
    db.exec(
      `UPDATE business_settings SET currency = 'USD' WHERE id = 'default' AND currency = 'VES'`
    )
    db.exec(`
      CREATE TABLE sales (
        id TEXT PRIMARY KEY,
        ticket_number TEXT NOT NULL UNIQUE,
        sold_at TEXT NOT NULL,
        customer_id TEXT REFERENCES customers(id),
        cashier_name TEXT NOT NULL,
        subtotal REAL NOT NULL,
        discount REAL NOT NULL,
        tax REAL NOT NULL,
        total REAL NOT NULL,
        payment_json TEXT NOT NULL,
        exchange_rate REAL,
        exchange_rate_updated_at TEXT
      );

      CREATE TABLE sale_items (
        id TEXT PRIMARY KEY,
        sale_id TEXT NOT NULL REFERENCES sales(id),
        product_id TEXT NOT NULL REFERENCES products(id),
        product_name TEXT NOT NULL,
        product_code TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit_price REAL NOT NULL,
        discount_percent REAL NOT NULL,
        line_total REAL NOT NULL
      );

      CREATE INDEX idx_sales_sold_at ON sales(sold_at);
      CREATE INDEX idx_sales_customer ON sales(customer_id);
      CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);

      CREATE TABLE suspended_sales (
        id TEXT PRIMARY KEY,
        ticket_number TEXT NOT NULL,
        payload TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE exchange_rates (
        id TEXT PRIMARY KEY CHECK (id = 'USD_VES_BCV'),
        rate REAL NOT NULL CHECK (rate > 0),
        updated_at TEXT NOT NULL
      );
    `)
  }
}
