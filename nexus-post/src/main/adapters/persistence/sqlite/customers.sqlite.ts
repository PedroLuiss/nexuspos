import type Database from 'better-sqlite3'
import type {
  Customer,
  CustomerInput,
  CustomerUpdateInput,
  CustomerFilter,
  CustomerDebt,
  CustomerPayment,
  CustomerAccountSummary
} from '@shared/contracts'
import type { CustomerRepository } from '../../../ports/customer.repository'

interface CustomerRow {
  id: string
  code: string
  name: string
  tax_id: string
  phone: string
  email: string
  address: string
  credit_limit: number
  current_debt: number
  credit_balance: number
  active: number
  deleted: number
  created_at: string
  updated_at: string
}

interface CustomerDebtRow {
  id: string
  customer_id: string
  ticket_number: string
  date: string
  total_amount: number
  balance: number
  status: string
  created_at: string
}

interface CustomerPaymentRow {
  id: string
  customer_id: string
  date: string
  amount: number
  concept: string
  cashier_name: string
  created_at: string
}

function mapRow(row: CustomerRow): Customer {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    taxId: row.tax_id,
    phone: row.phone,
    email: row.email,
    address: row.address,
    creditLimit: row.credit_limit,
    currentDebt: row.current_debt,
    creditBalance: row.credit_balance,
    active: Boolean(row.active),
    deleted: Boolean(row.deleted),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function mapDebtRow(row: CustomerDebtRow): CustomerDebt {
  return {
    id: row.id,
    customerId: row.customer_id,
    ticketNumber: row.ticket_number,
    date: row.date,
    totalAmount: row.total_amount,
    balance: row.balance,
    status: row.status as 'PENDING' | 'PARTIAL' | 'PAID'
  }
}

function mapPaymentRow(row: CustomerPaymentRow): CustomerPayment {
  return {
    id: row.id,
    customerId: row.customer_id,
    date: row.date,
    amount: row.amount,
    concept: row.concept,
    cashierName: row.cashier_name,
    createdAt: row.created_at
  }
}

/**
 * Adaptador SQLite de clientes, deudas y pagos.
 * Tablas creadas por la migración 011.
 */
export class SqliteCustomerRepository implements CustomerRepository {
  constructor(private readonly db: Database.Database) {}

  list(filter?: CustomerFilter): Customer[] {
    const clauses: string[] = ['deleted = 0']
    const params: Record<string, unknown> = {}

    if (filter?.onlyActive === true) {
      clauses.push('active = 1')
    }
    if (filter?.includeInactive === true) {
      // Incluir inactivos: no agregar filtro de active
    } else if (filter?.onlyActive !== true) {
      clauses.push('active = 1')
    }
    if (filter?.search) {
      clauses.push(
        '(code LIKE @search OR name LIKE @search OR tax_id LIKE @search OR phone LIKE @search)'
      )
      params.search = `%${filter.search}%`
    }
    if (filter?.onlyWithDebt === true) {
      clauses.push('current_debt > 0')
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const rows = this.db
      .prepare(`SELECT * FROM customers ${where} ORDER BY name COLLATE NOCASE ASC`)
      .all(params) as CustomerRow[]

    return rows.map(mapRow)
  }

  getById(id: string): Customer | null {
    const row = this.db
      .prepare<[string], CustomerRow>('SELECT * FROM customers WHERE id = ?')
      .get(id)
    return row ? mapRow(row) : null
  }

  create(input: CustomerInput): Customer {
    const now = new Date().toISOString()
    const id = `cust-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    this.db
      .prepare(
        `INSERT INTO customers (
          id, code, name, tax_id, phone, email, address,
          credit_limit, current_debt, active, deleted, created_at, updated_at
        ) VALUES (
          @id, @code, @name, @taxId, @phone, @email, @address,
          @creditLimit, @currentDebt, @active, @deleted, @createdAt, @updatedAt
        )`
      )
      .run({
        id,
        code: input.code,
        name: input.name,
        taxId: input.taxId,
        phone: input.phone,
        email: input.email,
        address: input.address,
        creditLimit: input.creditLimit,
        currentDebt: 0,
        active: 1,
        deleted: 0,
        createdAt: now,
        updatedAt: now
      })

    return this.getById(id) as Customer
  }

  update(input: CustomerUpdateInput): Customer {
    const current = this.getById(input.id)
    if (!current) {
      throw new Error(`Cliente con id "${input.id}" no encontrado.`)
    }

    const now = new Date().toISOString()

    this.db
      .prepare(
        `UPDATE customers SET
          code = @code, name = @name, tax_id = @taxId, phone = @phone,
          email = @email, address = @address, credit_limit = @creditLimit,
          updated_at = @updatedAt
        WHERE id = @id`
      )
      .run({
        id: input.id,
        code: input.code ?? current.code,
        name: input.name ?? current.name,
        taxId: input.taxId ?? current.taxId,
        phone: input.phone ?? current.phone,
        email: input.email ?? current.email,
        address: input.address ?? current.address,
        creditLimit: input.creditLimit ?? current.creditLimit,
        updatedAt: now
      })

    return this.getById(input.id) as Customer
  }

  delete(id: string): void {
    const current = this.getById(id)
    if (!current) {
      throw new Error(`Cliente con id "${id}" no encontrado.`)
    }
    this.db
      .prepare('UPDATE customers SET deleted = 1, active = 0, updated_at = ? WHERE id = ?')
      .run(new Date().toISOString(), id)
  }

  toggleStatus(id: string): Customer {
    const current = this.getById(id)
    if (!current) {
      throw new Error(`Cliente con id "${id}" no encontrado.`)
    }
    this.db
      .prepare('UPDATE customers SET active = CASE active WHEN 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?')
      .run(new Date().toISOString(), id)
    return this.getById(id) as Customer
  }

  getAccountSummary(customerId: string): CustomerAccountSummary | null {
    const customer = this.getById(customerId)
    if (!customer) return null

    const debts = this.listDebts(customerId)
    const payments = this.listPayments(customerId)

    const totalDebt = debts.reduce((acc, d) => acc + d.balance, 0)
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0)
    const availableCredit = Math.max(0, customer.creditLimit - totalDebt)

    return {
      customer,
      totalDebt,
      totalPaid,
      availableCredit,
      customerCreditBalance: customer.creditBalance ?? 0,
      debts,
      payments
    }
  }

  recordPayment(
    customerId: string,
    amount: number,
    concept: string,
    cashierName: string,
    cashShiftId: string
  ): CustomerPayment {
    return this.db.transaction(() => {
      const customer = this.getById(customerId)
      if (!customer) {
        throw new Error(`Cliente con id "${customerId}" no encontrado.`)
      }
      if (amount > customer.currentDebt) {
        throw new Error('El abono no puede ser mayor que la deuda actual del cliente.')
      }

      const now = new Date().toISOString()
      const id = `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      this.db
        .prepare(
          `INSERT INTO customer_payments (
            id, customer_id, date, amount, concept, cashier_name, created_at, cash_shift_id
          ) VALUES (
            @id, @customerId, @date, @amount, @concept, @cashierName, @createdAt, @cashShiftId
          )`
        )
        .run({
          id,
          customerId,
          date: now,
          amount,
          concept,
          cashierName,
          createdAt: now,
          cashShiftId
        })

      this.applyPaymentToDebts(customerId, amount)
      this.db
        .prepare('UPDATE customers SET current_debt = ?, updated_at = ? WHERE id = ?')
        .run(Math.max(0, customer.currentDebt - amount), now, customerId)

      return {
        id,
        customerId,
        date: now,
        amount,
        concept,
        cashierName,
        cashShiftId,
        createdAt: now
      }
    })()
  }

  listDebts(customerId: string): CustomerDebt[] {
    const rows = this.db
      .prepare<[string], CustomerDebtRow>(
        'SELECT * FROM customer_debts WHERE customer_id = ? AND status IN (\'PENDING\', \'PARTIAL\') ORDER BY date ASC'
      )
      .all(customerId)
    return rows.map(mapDebtRow)
  }

  listPayments(customerId: string): CustomerPayment[] {
    const rows = this.db
      .prepare<[string], CustomerPaymentRow>(
        'SELECT * FROM customer_payments WHERE customer_id = ? ORDER BY date DESC'
      )
      .all(customerId)
    return rows.map(mapPaymentRow)
  }

  createCreditSale(
    customerId: string,
    ticketNumber: string,
    totalAmount: number,
    date: string
  ): CustomerDebt {
    return this.db.transaction(() => {
      const customer = this.getById(customerId)
      if (!customer) {
        throw new Error(`Cliente con id "${customerId}" no encontrado.`)
      }

      const id = `debt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      this.db
        .prepare(
          `INSERT INTO customer_debts (
            id, customer_id, ticket_number, date, total_amount, balance, status, created_at
          ) VALUES (
            @id, @customerId, @ticketNumber, @date, @totalAmount, @balance, 'PENDING', @createdAt
          )`
        )
        .run({
          id,
          customerId,
          ticketNumber,
          date,
          totalAmount,
          balance: totalAmount,
          createdAt: date
        })

      this.db
        .prepare('UPDATE customers SET current_debt = ?, updated_at = ? WHERE id = ?')
        .run(customer.currentDebt + totalAmount, date, customerId)

      return {
        id,
        customerId,
        ticketNumber,
        date,
        totalAmount,
        balance: totalAmount,
        status: 'PENDING' as const
      }
    })()
  }

  applyPaymentToDebt(
    debtId: string,
    amount: number,
    cashierName: string,
    cashShiftId: string
  ): CustomerDebt {
    return this.db.transaction(() => {
      const row = this.db
        .prepare<[string], CustomerDebtRow>('SELECT * FROM customer_debts WHERE id = ?')
        .get(debtId)

      if (!row) {
        throw new Error(`Deuda con id "${debtId}" no encontrada.`)
      }
      if (amount > row.balance) {
        throw new Error('El abono no puede superar el saldo pendiente de la deuda.')
      }

      const customer = this.getById(row.customer_id)
      if (!customer) {
        throw new Error(`Cliente con id "${row.customer_id}" no encontrado.`)
      }
      if (amount > customer.currentDebt) {
        throw new Error('El abono no puede ser mayor que la deuda actual del cliente.')
      }

      const newBalance = row.balance - amount
      const newStatus: CustomerDebt['status'] =
        newBalance === 0 ? 'PAID' : newBalance < row.total_amount ? 'PARTIAL' : 'PENDING'
      const now = new Date().toISOString()

      this.db
        .prepare('UPDATE customer_debts SET balance = ?, status = ? WHERE id = ?')
        .run(newBalance, newStatus, debtId)
      this.db
        .prepare('UPDATE customers SET current_debt = ?, updated_at = ? WHERE id = ?')
        .run(Math.max(0, customer.currentDebt - amount), now, customer.id)
      this.db
        .prepare(
          `INSERT INTO customer_payments (
            id, customer_id, date, amount, concept, cashier_name, created_at, cash_shift_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          row.customer_id,
          now,
          amount,
          `Abono a ticket ${row.ticket_number}`,
          cashierName,
          now,
          cashShiftId
        )

      return {
        id: debtId,
        customerId: row.customer_id,
        ticketNumber: row.ticket_number,
        date: row.date,
        totalAmount: row.total_amount,
        balance: newBalance,
        status: newStatus
      }
    })()
  }

  refundCreditSale(customerId: string, ticketNumber: string, totalAmount: number): void {
    const debt = this.db.prepare(`
      SELECT id, balance FROM customer_debts WHERE customer_id = ? AND ticket_number = ?
    `).get(customerId, ticketNumber) as { id: string; balance: number } | undefined
    if (!debt) throw new Error('No se encontró la deuda asociada a la factura a crédito.')
    const customer = this.getById(customerId)
    if (!customer) throw new Error('El cliente asociado a la factura no existe.')

    const credited = Math.max(0, totalAmount - debt.balance)
    const now = new Date().toISOString()
    this.db.prepare(`
      UPDATE customer_debts SET balance = 0, status = 'CANCELLED'
      WHERE id = ? AND status != 'CANCELLED'
    `).run(debt.id)
    this.db.prepare(`
      UPDATE customers
      SET current_debt = ?, credit_balance = credit_balance + ?, updated_at = ?
      WHERE id = ?
    `).run(Math.max(0, customer.currentDebt - debt.balance), credited, now, customerId)
  }

  /** Aplica un monto de pago a las deudas pendientes (más antiguas primero). */
  private applyPaymentToDebts(customerId: string, amount: number): void {
    let remaining = amount
    const debts = this.listDebts(customerId)

    for (const debt of debts) {
      if (remaining <= 0) break
      const applyAmount = Math.min(remaining, debt.balance)
      const balance = debt.balance - applyAmount
      const status = balance === 0 ? 'PAID' : 'PARTIAL'
      this.db
        .prepare('UPDATE customer_debts SET balance = ?, status = ? WHERE id = ?')
        .run(balance, status, debt.id)
      remaining -= applyAmount
    }

    if (remaining > 0) {
      throw new Error('El saldo de las deudas no coincide con la deuda total del cliente.')
    }
  }
}
