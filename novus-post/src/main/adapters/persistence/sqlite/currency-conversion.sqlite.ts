import type Database from 'better-sqlite3'
import type { SuspendedSale } from '@shared/contracts'
import type {
  CurrencyConversion,
  CurrencyConversionRepository
} from '../../../ports/currency-conversion.repository'

interface SuspendedSaleRow {
  id: string
  payload: string
}

function scaleAmount(value: unknown, multiplier: number, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`No se puede convertir la venta pausada: el campo ${field} no es válido.`)
  }
  return Math.round((value * multiplier + Number.EPSILON) * 100) / 100
}

function convertSuspendedSale(
  payload: string,
  conversion: CurrencyConversion
): string {
  let sale: SuspendedSale & { currency?: string }
  try {
    sale = JSON.parse(payload) as SuspendedSale & { currency?: string }
  } catch {
    throw new Error('No se puede cambiar la moneda: hay una venta pausada con datos inválidos.')
  }

  if (sale.currency && sale.currency !== conversion.fromCurrency) {
    throw new Error(
      'No se puede cambiar la moneda: una venta pausada usa una moneda distinta a la moneda actual.'
    )
  }
  if (!Array.isArray(sale.items)) {
    throw new Error('No se puede cambiar la moneda: hay una venta pausada con artículos inválidos.')
  }

  const items = sale.items.map((item, index) => {
    const product = item.product
    if (!product || typeof product !== 'object') {
      throw new Error('No se puede cambiar la moneda: hay un producto pausado inválido.')
    }
    return {
      ...item,
      customPrice:
        item.customPrice === undefined
          ? undefined
          : scaleAmount(item.customPrice, conversion.multiplier, `items[${index}].customPrice`),
      total: scaleAmount(item.total, conversion.multiplier, `items[${index}].total`),
      product: {
        ...product,
        salePrice: scaleAmount(
          product.salePrice,
          conversion.multiplier,
          `items[${index}].product.salePrice`
        ),
        costPrice: scaleAmount(
          product.costPrice,
          conversion.multiplier,
          `items[${index}].product.costPrice`
        )
      }
    }
  })

  return JSON.stringify({
    ...sale,
    currency: conversion.toCurrency,
    subtotal: scaleAmount(sale.subtotal, conversion.multiplier, 'subtotal'),
    total: scaleAmount(sale.total, conversion.multiplier, 'total'),
    items
  })
}

export class SqliteCurrencyConversionRepository implements CurrencyConversionRepository {
  constructor(private readonly db: Database.Database) {}

  hasOpenCashShift(): boolean {
    return Boolean(
      this.db.prepare('SELECT 1 FROM cash_shifts WHERE closed_at IS NULL LIMIT 1').get()
    )
  }

  convertOperationalAmounts(conversion: CurrencyConversion): void {
    if (this.hasOpenCashShift()) {
      throw new Error('Cierre todas las cajas abiertas antes de cambiar la moneda del negocio.')
    }
    if (!Number.isFinite(conversion.multiplier) || conversion.multiplier <= 0) {
      throw new Error('No se puede cambiar la moneda porque el factor de conversión no es válido.')
    }

    const suspendedSales = this.db
      .prepare('SELECT id, payload FROM suspended_sales')
      .all() as SuspendedSaleRow[]
    const convertedSuspendedSales = suspendedSales.map((row) => ({
      id: row.id,
      payload: convertSuspendedSale(row.payload, conversion)
    }))

    const { multiplier, toCurrency, changedAt } = conversion
    this.db
      .prepare(
        `UPDATE products
         SET cost_price = ROUND(cost_price * @multiplier, 2),
             sale_price = ROUND(sale_price * @multiplier, 2),
             updated_at = @changedAt
         WHERE deleted = 0`
      )
      .run({ multiplier, changedAt })
    this.db
      .prepare(
        `UPDATE product_price_tiers
         SET price = ROUND(price * @multiplier, 2), updated_at = @changedAt
         WHERE deleted = 0 AND product_id IN (SELECT id FROM products WHERE deleted = 0)`
      )
      .run({ multiplier, changedAt })
    this.db
      .prepare(
        `UPDATE customers
         SET credit_limit = ROUND(credit_limit * @multiplier, 2),
             credit_balance = ROUND(credit_balance * @multiplier, 2),
             currency = @toCurrency,
             updated_at = @changedAt
         WHERE deleted = 0`
      )
      .run({ multiplier, toCurrency, changedAt })
    this.db
      .prepare(
        `UPDATE customer_debts
         SET total_amount = ROUND(total_amount * @multiplier, 2),
             balance = ROUND(balance * @multiplier, 2),
             status = CASE WHEN ROUND(balance * @multiplier, 2) = 0 THEN 'PAID' ELSE status END,
             currency = @toCurrency
         WHERE status IN ('PENDING', 'PARTIAL') AND balance > 0`
      )
      .run({ multiplier, toCurrency })
    this.db
      .prepare(
        `UPDATE customers
         SET current_debt = COALESCE((
           SELECT ROUND(SUM(balance), 2)
           FROM customer_debts
           WHERE customer_id = customers.id
             AND status IN ('PENDING', 'PARTIAL')
             AND balance > 0
         ), 0),
             updated_at = @changedAt
         WHERE deleted = 0`
      )
      .run({ changedAt })

    const updateSuspendedSale = this.db.prepare(
      'UPDATE suspended_sales SET payload = ? WHERE id = ?'
    )
    for (const sale of convertedSuspendedSales) {
      updateSuspendedSale.run(sale.payload, sale.id)
    }

    this.db
      .prepare(
        `INSERT INTO currency_change_log (
           id, from_currency, to_currency, from_rate_to_ves, to_rate_to_ves,
           multiplier, changed_at, changed_by
         ) VALUES (
           @id, @fromCurrency, @toCurrency, @fromRateToVes, @toRateToVes,
           @multiplier, @changedAt, @changedBy
         )`
      )
      .run({
        ...conversion,
        id: `currency-change-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      })
  }
}
