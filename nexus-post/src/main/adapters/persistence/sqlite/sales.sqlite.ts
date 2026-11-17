import type Database from 'better-sqlite3'
import type { SuspendedSale } from '@shared/contracts'
import type {
  SaleItemRecord,
  SaleRecord,
  SalesRepository
} from '../../../ports/sales.repository'

interface SuspendedSaleRow {
  payload: string
}

export class SqliteSalesRepository implements SalesRepository {
  constructor(private readonly db: Database.Database) {}

  insertSale(sale: SaleRecord, items: SaleItemRecord[]): void {
    this.db.prepare(`
      INSERT INTO sales (
        id, ticket_number, sold_at, customer_id, cashier_name,
        subtotal, discount, tax, total, payment_json,
        exchange_rate, exchange_rate_updated_at
      ) VALUES (
        @id, @ticketNumber, @soldAt, @customerId, @cashierName,
        @subtotal, @discount, @tax, @total, @paymentJson,
        @exchangeRate, @exchangeRateUpdatedAt
      )
    `).run({
      id: sale.id,
      ticketNumber: sale.ticketNumber,
      soldAt: sale.soldAt,
      customerId: sale.customerId ?? null,
      cashierName: sale.cashierName,
      subtotal: sale.subtotal,
      discount: sale.discount,
      tax: sale.tax,
      total: sale.total,
      paymentJson: JSON.stringify(sale.payment),
      exchangeRate: sale.exchangeRate ?? null,
      exchangeRateUpdatedAt: sale.exchangeRateUpdatedAt ?? null
    })

    const insertItem = this.db.prepare(`
      INSERT INTO sale_items (
        id, sale_id, product_id, product_name, product_code,
        quantity, unit_price, discount_percent, line_total
      ) VALUES (
        @id, @saleId, @productId, @productName, @productCode,
        @quantity, @unitPrice, @discountPercent, @lineTotal
      )
    `)
    for (const item of items) {
      insertItem.run({
        id: `sale-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        saleId: sale.id,
        ...item
      })
    }
  }

  listSuspended(): SuspendedSale[] {
    const rows = this.db
      .prepare('SELECT payload FROM suspended_sales ORDER BY created_at DESC')
      .all() as SuspendedSaleRow[]
    return rows.map(({ payload }) => JSON.parse(payload) as SuspendedSale)
  }

  saveSuspended(sale: SuspendedSale): void {
    this.db.prepare(`
      INSERT INTO suspended_sales (id, ticket_number, payload, created_at)
      VALUES (@id, @ticketNumber, @payload, @createdAt)
      ON CONFLICT(id) DO UPDATE SET
        ticket_number = excluded.ticket_number,
        payload = excluded.payload,
        created_at = excluded.created_at
    `).run({
      id: sale.id,
      ticketNumber: sale.name,
      payload: JSON.stringify(sale),
      createdAt: new Date().toISOString()
    })
  }

  deleteSuspended(id: string): void {
    this.db.prepare('DELETE FROM suspended_sales WHERE id = ?').run(id)
  }
}
