import type Database from 'better-sqlite3'
import type { CashTicket, SaleItemBatch, SalePayment, SuspendedSale } from '@shared/contracts'
import type { SaleItemRecord, SaleRecord, SalesRepository } from '../../../ports/sales.repository'

interface SuspendedSaleRow {
  payload: string
}

interface TicketRow {
  id: string
  cash_shift_id: string
  ticket_number: string
  sold_at: string
  cashier_name: string
  customer_id: string | null
  customer_name: string | null
  subtotal: number
  discount: number
  tax: number
  total: number
  payment_json: string
  returned_at: string | null
  return_payment_json: string | null
  return_cash_amount: number
}

interface TicketItemRow {
  product_id: string
  product_name: string
  product_code: string
  quantity: number
  unit_price: number
  unit_cost: number
  discount_percent: number
  line_total: number
  is_combo: number
  combo_id: string | null
  batches_json: string | null
}

interface TicketTaxRow {
  tax_id: string | null
  tax_name: string
  tax_rate: number
  taxable_base: number
  amount: number
}

export class SqliteSalesRepository implements SalesRepository {
  constructor(private readonly db: Database.Database) {}

  insertSale(sale: SaleRecord, items: SaleItemRecord[]): void {
    this.db
      .prepare(
        `
      INSERT INTO sales (
        id, ticket_number, sold_at, customer_id, cashier_name, cash_shift_id,
        subtotal, discount, tax, total, payment_json,
        exchange_rate, exchange_rate_updated_at
      ) VALUES (
        @id, @ticketNumber, @soldAt, @customerId, @cashierName, @cashShiftId,
        @subtotal, @discount, @tax, @total, @paymentJson,
        @exchangeRate, @exchangeRateUpdatedAt
      )
    `
      )
      .run({
        id: sale.id,
        ticketNumber: sale.ticketNumber,
        soldAt: sale.soldAt,
        customerId: sale.customerId ?? null,
        cashierName: sale.cashierName,
        cashShiftId: sale.cashShiftId,
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
        quantity, unit_price, unit_cost, discount_percent, line_total,
        is_combo, combo_id, batches_json
      ) VALUES (
        @id, @saleId, @productId, @productName, @productCode,
        @quantity, @unitPrice, @unitCost, @discountPercent, @lineTotal,
        @isCombo, @comboId, @batchesJson
      )
    `)
    for (const item of items) {
      insertItem.run({
        id: `sale-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        saleId: sale.id,
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitCost: item.unitCost,
        discountPercent: item.discountPercent,
        lineTotal: item.lineTotal,
        isCombo: item.isCombo ? 1 : 0,
        comboId: item.comboId ?? null,
        batchesJson: item.batches?.length ? JSON.stringify(item.batches) : ''
      })
    }

    if (sale.taxBreakdown?.length) {
      const insertTax = this.db.prepare(`
        INSERT INTO sale_taxes (
          id, sale_id, tax_id, tax_name, tax_rate, taxable_base, amount
        ) VALUES (
          @id, @saleId, @taxId, @taxName, @taxRate, @taxableBase, @amount
        )
      `)
      for (const line of sale.taxBreakdown) {
        insertTax.run({
          id: `sale-tax-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          saleId: sale.id,
          taxId: line.taxId ?? null,
          taxName: line.taxName,
          taxRate: line.taxRate,
          taxableBase: line.taxableBase,
          amount: line.amount
        })
      }
    }
  }

  findTicket(id: string): CashTicket | null {
    const row = this.db
      .prepare(
        `
      SELECT s.*, c.name AS customer_name
      FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
      WHERE s.id = ?
    `
      )
      .get(id) as TicketRow | undefined
    if (!row) return null
    const items = this.db
      .prepare(
        `
      SELECT product_id, product_name, product_code, quantity, unit_price,
        unit_cost, discount_percent, line_total, is_combo, combo_id, batches_json
      FROM sale_items WHERE sale_id = ? ORDER BY rowid
    `
      )
      .all(id) as TicketItemRow[]
    const taxRows = this.db
      .prepare(
        `
      SELECT tax_id, tax_name, tax_rate, taxable_base, amount
      FROM sale_taxes WHERE sale_id = ? ORDER BY tax_rate DESC
    `
      )
      .all(id) as TicketTaxRow[]
    return {
      id: row.id,
      shiftId: row.cash_shift_id,
      ticketNumber: row.ticket_number,
      soldAt: row.sold_at,
      cashierName: row.cashier_name,
      customerId: row.customer_id ?? undefined,
      customerName: row.customer_name ?? undefined,
      subtotal: row.subtotal,
      discount: row.discount,
      tax: row.tax,
      total: row.total,
      taxBreakdown:
        taxRows.length > 0
          ? taxRows.map((tax) => ({
              taxId: tax.tax_id ?? undefined,
              taxName: tax.tax_name,
              taxRate: tax.tax_rate,
              taxableBase: tax.taxable_base,
              amount: tax.amount
            }))
          : undefined,
      payment: JSON.parse(row.payment_json) as SalePayment,
      items: items.map((item) => {
        let batches: SaleItemBatch[] | undefined
        if (item.batches_json) {
          try {
            batches = JSON.parse(item.batches_json) as SaleItemBatch[]
          } catch {
            batches = undefined
          }
        }
        return {
          productId: item.product_id,
          productName: item.product_name,
          productCode: item.product_code,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          unitCost: item.unit_cost,
          discountPercent: item.discount_percent,
          lineTotal: item.line_total,
          isCombo: item.is_combo === 1,
          comboId: item.combo_id ?? undefined,
          batches
        }
      }),
      returnedAt: row.returned_at ?? undefined,
      returnPayment: row.return_payment_json
        ? (JSON.parse(row.return_payment_json) as SalePayment)
        : undefined,
      returnCashAmount: row.return_cash_amount
    }
  }

  markReturned(saleId: string, returnedAt: string, payment: SalePayment, cashAmount: number): void {
    const result = this.db
      .prepare(
        `
      UPDATE sales
      SET returned_at = ?, return_payment_json = ?, return_cash_amount = ?
      WHERE id = ? AND returned_at IS NULL
    `
      )
      .run(returnedAt, JSON.stringify(payment), cashAmount, saleId)
    if (result.changes !== 1) throw new Error('La factura ya fue devuelta o no existe.')
  }

  listSuspended(cashierId: string): SuspendedSale[] {
    const rows = this.db
      .prepare('SELECT payload FROM suspended_sales WHERE cashier_id = ? ORDER BY created_at DESC')
      .all(cashierId) as SuspendedSaleRow[]
    return rows.map(({ payload }) => JSON.parse(payload) as SuspendedSale)
  }

  saveSuspended(sale: SuspendedSale, cashierId: string): void {
    this.db
      .prepare(
        `
      INSERT INTO suspended_sales (id, ticket_number, payload, created_at, cashier_id)
      VALUES (@id, @ticketNumber, @payload, @createdAt, @cashierId)
      ON CONFLICT(id) DO UPDATE SET
        ticket_number = excluded.ticket_number,
        payload = excluded.payload,
        created_at = excluded.created_at,
        cashier_id = excluded.cashier_id
    `
      )
      .run({
        id: sale.id,
        ticketNumber: sale.name,
        payload: JSON.stringify({ ...sale, cashierId }),
        createdAt: new Date().toISOString(),
        cashierId
      })
  }

  deleteSuspended(id: string, cashierId: string): void {
    this.db
      .prepare('DELETE FROM suspended_sales WHERE id = ? AND cashier_id = ?')
      .run(id, cashierId)
  }
}
