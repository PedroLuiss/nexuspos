import type Database from 'better-sqlite3'
import type {
  CashMovement,
  CashRegisterData,
  CashSaleItem,
  CashShift,
  CashTicket,
  SalePayment,
  UserRole
} from '@shared/contracts'
import type { CurrencyCode } from '@shared/contracts'
import type { CashRepository, OpenCashShiftRecord } from '../../../ports/cash.repository'

interface ShiftRow {
  id: string
  cashier_id: string
  cashier_name: string
  station_name: string
  opened_at: string
  opening_amount: number
  closed_at: string | null
  expected_cash: number | null
  counted_cash: number | null
  difference: number | null
  currency: CurrencyCode
}

interface MovementRow {
  id: string
  shift_id: string
  created_at: string
  type: CashMovement['type']
  amount: number
  cash_effect: number
  concept: string
  cashier_name: string
  station_name: string
  source: CashMovement['source']
  payment_method: SalePayment['method'] | null
  source_id: string | null
  currency: CurrencyCode
}

interface TicketRow {
  id: string
  cash_shift_id: string
  ticket_number: string
  sold_at: string
  cashier_name: string
  station_name: string
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
  currency: CurrencyCode
}

interface TicketItemRow {
  sale_id: string
  product_id: string
  product_name: string
  product_code: string
  quantity: number
  unit_price: number
  unit_cost: number
  discount_percent: number
  line_total: number
}

const sum = (values: number[]): number => values.reduce((total, value) => total + value, 0)
const money = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100

function mapMovement(row: MovementRow): CashMovement {
  return {
    id: row.id,
    shiftId: row.shift_id,
    createdAt: row.created_at,
    type: row.type,
    amount: row.amount,
    cashEffect: row.cash_effect,
    concept: row.concept,
    cashierName: row.cashier_name,
    stationName: row.station_name,
    source: row.source,
    paymentMethod: row.payment_method ?? undefined,
    sourceId: row.source_id ?? undefined,
    currency: row.currency
  }
}

function mapTicket(row: TicketRow, items: CashSaleItem[]): CashTicket {
  return {
    id: row.id,
    shiftId: row.cash_shift_id,
    ticketNumber: row.ticket_number,
    soldAt: row.sold_at,
    cashierName: row.cashier_name,
    stationName: row.station_name,
    customerId: row.customer_id ?? undefined,
    customerName: row.customer_name ?? undefined,
    subtotal: row.subtotal,
    discount: row.discount,
    tax: row.tax,
    total: row.total,
    currency: row.currency,
    payment: JSON.parse(row.payment_json) as SalePayment,
    items,
    returnedAt: row.returned_at ?? undefined,
    returnPayment: row.return_payment_json
      ? (JSON.parse(row.return_payment_json) as SalePayment)
      : undefined,
    returnCashAmount: row.return_cash_amount
  }
}

export class SqliteCashRepository implements CashRepository {
  constructor(private readonly db: Database.Database) {}

  getActiveShift(cashierId: string): OpenCashShiftRecord | null {
    const row = this.db
      .prepare(
        `SELECT id, cashier_id AS cashierId, cashier_name AS cashierName,
          station_name AS stationName, opened_at AS openedAt, opening_amount AS openingAmount, currency
         FROM cash_shifts WHERE cashier_id = ? AND closed_at IS NULL`
      )
      .get(cashierId) as OpenCashShiftRecord | undefined
    return row ?? null
  }

  getRegister(cashierId: string, shiftId?: string, includeAllCashiers = false): CashRegisterData {
    const active = this.db
      .prepare('SELECT * FROM cash_shifts WHERE cashier_id = ? AND closed_at IS NULL')
      .get(cashierId) as ShiftRow | undefined
    const shiftOptionRows = this.db
      .prepare(
        `
      SELECT cash_shifts.id, cash_shifts.opened_at AS openedAt,
        cash_shifts.closed_at AS closedAt, cash_shifts.cashier_name AS cashierName,
        cash_shifts.station_name AS stationName,
        cash_shifts.opening_amount AS openingAmount, cash_shifts.currency,
        users.role AS cashierRole,
        COALESCE(expected_cash, opening_amount + (
          SELECT COALESCE(SUM(cash_effect), 0) FROM cash_movements
          WHERE cash_movements.shift_id = cash_shifts.id
        )) AS expectedCash,
        cash_shifts.counted_cash AS countedCash, cash_shifts.difference,
        COALESCE((
          SELECT SUM(sales.total) FROM sales
          WHERE sales.cash_shift_id = cash_shifts.id AND sales.returned_at IS NULL
        ), 0) AS totalSales,
        (
          SELECT COUNT(*) FROM sales
          WHERE sales.cash_shift_id = cash_shifts.id AND sales.returned_at IS NULL
        ) AS ticketCount
      FROM cash_shifts
      LEFT JOIN users ON users.id = cash_shifts.cashier_id
      WHERE (@includeAllCashiers = 1 OR cash_shifts.cashier_id = @cashierId)
      ORDER BY cash_shifts.opened_at DESC
    `
      )
      .all({ cashierId, includeAllCashiers: includeAllCashiers ? 1 : 0 }) as Array<{
      id: string
      openedAt: string
      closedAt: string | null
      cashierName: string
      stationName: string
      openingAmount: number
      currency: CurrencyCode
      cashierRole: UserRole | null
      expectedCash: number
      countedCash: number | null
      difference: number | null
      totalSales: number
      ticketCount: number
    }>
    const shiftOptions: CashRegisterData['shiftOptions'] = shiftOptionRows.map(
      ({ closedAt, countedCash, difference, cashierRole, ...option }) => ({
        ...option,
        closedAt: closedAt ?? undefined,
        countedCash: countedCash ?? undefined,
        difference: difference ?? undefined,
        cashierRole: cashierRole ?? undefined
      })
    )
    const selected = shiftId
      ? (this.db
          .prepare(
            `SELECT * FROM cash_shifts
             WHERE id = ? AND (? = 1 OR cashier_id = ?)`
          )
          .get(shiftId, includeAllCashiers ? 1 : 0, cashierId) as ShiftRow | undefined)
      : undefined
    if (shiftId && !selected) {
      throw new Error('El turno seleccionado no está disponible para el usuario autenticado.')
    }
    const latestOpenCashier = includeAllCashiers
      ? (this.db
          .prepare(
            `SELECT cash_shifts.*
             FROM cash_shifts
             INNER JOIN users ON users.id = cash_shifts.cashier_id
             WHERE users.role = 'CASHIER' AND cash_shifts.closed_at IS NULL
             ORDER BY cash_shifts.opened_at DESC LIMIT 1`
          )
          .get() as ShiftRow | undefined)
      : undefined
    const latest = active
      ? undefined
      : (latestOpenCashier ??
        (this.db
          .prepare('SELECT * FROM cash_shifts WHERE cashier_id = ? ORDER BY opened_at DESC LIMIT 1')
          .get(cashierId) as ShiftRow | undefined))
    const row = selected ?? active ?? latest
    if (!row)
      return { shift: null, activeShiftId: active?.id, shiftOptions, movements: [], tickets: [] }

    const movementRows = this.db
      .prepare(
        `SELECT cash_movements.*, cash_shifts.station_name
         FROM cash_movements
         INNER JOIN cash_shifts ON cash_shifts.id = cash_movements.shift_id
         WHERE cash_movements.shift_id = ? ORDER BY cash_movements.created_at DESC`
      )
      .all(row.id) as MovementRow[]
    const ticketRows = this.db
      .prepare(
        `SELECT s.*, c.name AS customer_name, cash_shifts.station_name
         FROM sales s
         LEFT JOIN customers c ON c.id = s.customer_id
         INNER JOIN cash_shifts ON cash_shifts.id = s.cash_shift_id
         WHERE s.cash_shift_id = ? ORDER BY s.sold_at DESC`
      )
      .all(row.id) as TicketRow[]
    const itemRows = this.db
      .prepare(
        `SELECT sale_id, product_id, product_name, product_code, quantity,
          unit_price, unit_cost, discount_percent, line_total
         FROM sale_items WHERE sale_id IN (
           SELECT id FROM sales WHERE cash_shift_id = ?
         ) ORDER BY rowid`
      )
      .all(row.id) as TicketItemRow[]
    const itemsBySale = new Map<string, CashSaleItem[]>()
    for (const item of itemRows) {
      const list = itemsBySale.get(item.sale_id) ?? []
      list.push({
        productId: item.product_id,
        productName: item.product_name,
        productCode: item.product_code,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        unitCost: item.unit_cost,
        discountPercent: item.discount_percent,
        lineTotal: item.line_total
      })
      itemsBySale.set(item.sale_id, list)
    }

    const tickets = ticketRows.map((ticket) => mapTicket(ticket, itemsBySale.get(ticket.id) ?? []))
    const activeTickets = tickets.filter((ticket) => !ticket.returnedAt)
    const movements = movementRows.map(mapMovement)
    const cashPayments = activeTickets.map((ticket) =>
      ticket.payment.method === 'mixed'
        ? (ticket.payment.cashAmount ?? 0)
        : ticket.payment.method === 'cash'
          ? ticket.total
          : 0
    )
    const cardPayments = activeTickets.map((ticket) =>
      ticket.payment.method === 'mixed'
        ? (ticket.payment.cardAmount ?? 0)
        : ticket.payment.method === 'card'
          ? ticket.total
          : 0
    )
    const mixedPayments = activeTickets
      .filter((ticket) => ticket.payment.method === 'mixed')
      .map((ticket) => ticket.total)
    const creditPayments = activeTickets
      .filter((ticket) => ticket.payment.method === 'credit')
      .map((ticket) => ticket.total)
    const grossProfit = activeTickets.flatMap((ticket) =>
      ticket.items.map((item) => item.lineTotal - item.unitCost * item.quantity)
    )
    const taxCollected = activeTickets.map((ticket) => ticket.tax)
    const totalSales = activeTickets.map((ticket) => ticket.total)
    const totalRefunds = tickets.filter((ticket) => ticket.returnedAt).map((ticket) => ticket.total)
    const expectedCash = money(
      row.opening_amount + sum(movements.map((movement) => movement.cashEffect))
    )

    const shift: CashShift = {
      id: row.id,
      cashierId: row.cashier_id,
      cashierName: row.cashier_name,
      stationName: row.station_name,
      openedAt: row.opened_at,
      openingAmount: row.opening_amount,
      isOpen: row.closed_at === null,
      closedAt: row.closed_at ?? undefined,
      expectedCash: row.closed_at ? (row.expected_cash ?? expectedCash) : expectedCash,
      countedCash: row.counted_cash ?? undefined,
      difference: row.difference ?? undefined,
      cashSales: money(sum(cashPayments)),
      cardSales: money(sum(cardPayments)),
      mixedSales: money(sum(mixedPayments)),
      creditSales: money(sum(creditPayments)),
      customerPayments: money(
        sum(
          movements
            .filter((movement) => movement.source === 'CUSTOMER_PAYMENT')
            .map((movement) => movement.amount)
        )
      ),
      manualIncomes: money(
        sum(
          movements
            .filter((movement) => movement.source === 'MANUAL' && movement.type === 'INGRESO')
            .map((movement) => movement.amount)
        )
      ),
      manualExpenses: money(
        sum(
          movements
            .filter((movement) => movement.source === 'MANUAL' && movement.type === 'EGRESO')
            .map((movement) => movement.amount)
        )
      ),
      cashRefunds: money(
        sum(
          movements
            .filter((movement) => movement.source === 'SALE_REFUND')
            .map((movement) => -movement.cashEffect)
        )
      ),
      totalSales: money(sum(totalSales)),
      totalRefunds: money(sum(totalRefunds)),
      grossProfit: money(sum(grossProfit)),
      taxCollected: money(sum(taxCollected)),
      ticketCount: tickets.length,
      currency: row.currency
    }
    return { shift, activeShiftId: active?.id, shiftOptions, movements, tickets }
  }

  openShift(
    cashierId: string,
    cashierName: string,
    stationName: string,
    openingAmount: number,
    currency: CurrencyCode
  ): void {
    this.db
      .prepare(
        `
      INSERT INTO cash_shifts (
        id, cashier_id, cashier_name, station_name, opened_at, opening_amount, currency
      ) VALUES (
        @id, @cashierId, @cashierName, @stationName, @openedAt, @openingAmount, @currency
      )
    `
      )
      .run({
        id: `shift-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        cashierId,
        cashierName,
        stationName,
        openedAt: new Date().toISOString(),
        openingAmount,
        currency
      })
  }

  closeShift(
    shiftId: string,
    closedAt: string,
    expectedCash: number,
    countedCash: number,
    difference: number
  ): void {
    const result = this.db
      .prepare(
        `
      UPDATE cash_shifts SET closed_at = ?, expected_cash = ?, counted_cash = ?, difference = ?
      WHERE id = ? AND closed_at IS NULL
    `
      )
      .run(closedAt, expectedCash, countedCash, difference, shiftId)
    if (result.changes !== 1) throw new Error('El turno ya fue cerrado o no existe.')
  }

  insertMovement(movement: Omit<CashMovement, 'id' | 'createdAt' | 'stationName'>): void {
    this.db
      .prepare(
        `
      INSERT INTO cash_movements (
        id, shift_id, created_at, type, amount, cash_effect, concept,
        cashier_name, source, payment_method, source_id, currency
      ) VALUES (
        @id, @shiftId, @createdAt, @type, @amount, @cashEffect, @concept,
        @cashierName, @source, @paymentMethod, @sourceId, @currency
      )
    `
      )
      .run({
        id: `cash-mov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
        shiftId: movement.shiftId,
        type: movement.type,
        amount: movement.amount,
        cashEffect: movement.cashEffect,
        concept: movement.concept,
        cashierName: movement.cashierName,
        source: movement.source,
        paymentMethod: movement.paymentMethod ?? null,
        sourceId: movement.sourceId ?? null,
        currency: movement.currency
      })
  }

  insertRefund(
    saleId: string,
    shiftId: string,
    cashierId: string,
    returnedAt: string,
    amount: number,
    payment: SalePayment,
    cashAmount: number
  ): void {
    this.db
      .prepare(
        `
      INSERT INTO sale_refunds (
        id, sale_id, cash_shift_id, cashier_id, returned_at, amount, payment_json, cash_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
      )
      .run(
        `refund-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        saleId,
        shiftId,
        cashierId,
        returnedAt,
        amount,
        JSON.stringify(payment),
        cashAmount
      )
  }
}
