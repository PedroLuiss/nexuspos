import type {
  Customer,
  CustomerInput,
  CustomerUpdateInput,
  CustomerFilter,
  CustomerDebt,
  CustomerPayment,
  CustomerAccountSummary,
  CustomerPaymentInput,
  ApplyPaymentToDebtInput
} from '@shared/contracts'

function cleanErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : typeof err === 'string' ? err : ''
  if (!raw) return 'No se pudo completar la operación de clientes.'
  return raw.replace(/^Error invoking remote method '[^']+':\s*(Error:\s*)?/, '')
}

/**
 * Wrapper de `window.api.customers` con fallback en memoria para el preview de Vite.
 * En la aplicación real todo se persiste en las tablas `customers`, `customer_debts` y `customer_payments` de SQLite.
 */
const fallbackCustomers: Customer[] = [
  {
    id: 'cust-001',
    code: 'CLI-001',
    name: 'Distribuidora del Norte S.A.',
    taxId: 'XAXX010101000',
    phone: '55-1234-5678',
    email: 'ventas@norte.com',
    address: 'Av. Siempre Viva 123, Col. Centro',
    creditLimit: 5000,
    currentDebt: 0,
    currency: 'USD',
    active: true,
    deleted: false
  },
  {
    id: 'cust-002',
    code: 'CLI-002',
    name: 'Juan Pérez Rodríguez',
    taxId: 'V-12345678',
    phone: '55-8765-4321',
    email: 'juan.perez@email.com',
    address: 'Calle Libertad 456, Col. Reforma',
    creditLimit: 3000,
    currentDebt: 0,
    currency: 'USD',
    active: true,
    deleted: false
  },
  {
    id: 'cust-003',
    code: 'CLI-003',
    name: 'Comercial Sur C.A.',
    taxId: 'J-00000000-0',
    phone: '55-2222-3333',
    email: 'contacto@sur.com',
    address: 'Av. Principal 789, Col. Sur',
    creditLimit: 10000,
    currentDebt: 2500,
    currency: 'USD',
    active: true,
    deleted: false
  }
]

const fallbackDebts: CustomerDebt[] = [
  {
    id: 'debt-001',
    customerId: 'cust-003',
    ticketNumber: 'TKT-000123',
    date: new Date().toISOString(),
    totalAmount: 2500,
    balance: 2500,
    status: 'PENDING',
    currency: 'USD'
  }
]

const fallbackPayments: CustomerPayment[] = [
  {
    id: 'pay-001',
    customerId: 'cust-003',
    date: new Date().toISOString(),
    amount: 500,
    concept: 'Abono parcial',
    cashierName: 'Administrador',
    createdAt: new Date().toISOString(),
    currency: 'USD'
  }
]

export const customersApi = {
  list: async (filter?: CustomerFilter): Promise<Customer[]> => {
    if (window.api?.customers) return window.api.customers.list(filter)
    let result = fallbackCustomers.filter((customer) => !customer.deleted)
    if (filter?.includeInactive !== true || filter?.onlyActive === true) {
      result = result.filter((customer) => customer.active)
    }
    if (filter?.search) {
      const s = filter.search.toLowerCase()
      result = result.filter(
        (c) =>
          c.code.toLowerCase().includes(s) ||
          c.name.toLowerCase().includes(s) ||
          c.taxId.toLowerCase().includes(s) ||
          c.phone.toLowerCase().includes(s)
      )
    }
    if (filter?.onlyWithDebt === true) result = result.filter((c) => c.currentDebt > 0)
    return result
  },

  getById: async (id: string): Promise<Customer | null> => {
    if (window.api?.customers) return window.api.customers.getById(id)
    return fallbackCustomers.find((c) => c.id === id) ?? null
  },

  create: async (input: CustomerInput): Promise<Customer> => {
    if (window.api?.customers) return window.api.customers.create(input)
    const newCustomer: Customer = {
      ...input,
      id: `cust-${Date.now()}`,
      currentDebt: 0,
      currency: 'USD',
      active: true,
      deleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    fallbackCustomers.push(newCustomer)
    return newCustomer
  },

  update: async (input: CustomerUpdateInput): Promise<Customer> => {
    if (window.api?.customers) return window.api.customers.update(input)
    const idx = fallbackCustomers.findIndex((c) => c.id === input.id)
    if (idx === -1) throw new Error('Cliente no encontrado.')
    fallbackCustomers[idx] = {
      ...fallbackCustomers[idx],
      ...input,
      updatedAt: new Date().toISOString()
    }
    return fallbackCustomers[idx]
  },

  delete: async (id: string): Promise<void> => {
    if (window.api?.customers) return window.api.customers.delete(id)
    const idx = fallbackCustomers.findIndex((c) => c.id === id)
    if (idx === -1) throw new Error('Cliente no encontrado.')
    fallbackCustomers[idx] = { ...fallbackCustomers[idx], deleted: true, active: false }
  },

  toggleStatus: async (id: string): Promise<Customer> => {
    if (window.api?.customers) return window.api.customers.toggleStatus(id)
    const c = fallbackCustomers.find((c) => c.id === id)
    if (!c) throw new Error('Cliente no encontrado.')
    c.active = !c.active
    return c
  },

  getAccountSummary: async (customerId: string): Promise<CustomerAccountSummary | null> => {
    if (window.api?.customers) return window.api.customers.getAccountSummary(customerId)
    const customer = fallbackCustomers.find((c) => c.id === customerId)
    if (!customer) throw new Error('Cliente no encontrado.')
    const debts = fallbackDebts.filter((d) => d.customerId === customerId)
    const payments = fallbackPayments.filter((p) => p.customerId === customerId)
    const totalDebt = debts.reduce((acc, d) => acc + d.balance, 0)
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0)
    return {
      customer,
      totalDebt,
      totalPaid,
      availableCredit: Math.max(0, customer.creditLimit - totalDebt),
      customerCreditBalance: customer.creditBalance ?? 0,
      debts,
      payments
    }
  },

  recordPayment: async (input: CustomerPaymentInput): Promise<CustomerPayment> => {
    if (window.api?.customers) return window.api.customers.recordPayment(input)
    const customer = fallbackCustomers.find((c) => c.id === input.customerId)
    const debts = fallbackDebts
      .filter((d) => d.customerId === input.customerId && d.balance > 0)
      .sort((a, b) => a.date.localeCompare(b.date))
    if (!customer) throw new Error('Cliente no encontrado.')
    if (
      !Number.isFinite(input.amount) ||
      input.amount <= 0 ||
      input.amount > customer.currentDebt
    ) {
      throw new Error('El monto del abono no es válido para la deuda actual.')
    }
    if (debts.reduce((sum, debt) => sum + debt.balance, 0) < input.amount) {
      throw new Error('El saldo de las deudas no coincide con la deuda del cliente.')
    }

    let remaining = input.amount
    for (const debt of debts) {
      if (remaining <= 0) break
      const applied = Math.min(remaining, debt.balance)
      debt.balance -= applied
      debt.status = debt.balance === 0 ? 'PAID' : 'PARTIAL'
      remaining -= applied
    }

    const payment: CustomerPayment = {
      id: `pay-${Date.now()}`,
      customerId: input.customerId,
      date: new Date().toISOString(),
      amount: input.amount,
      concept: input.concept,
      cashierName: 'Operador',
      createdAt: new Date().toISOString(),
      currency: customer.currency
    }
    fallbackPayments.push(payment)
    customer.currentDebt -= input.amount
    return payment
  },

  listDebts: async (customerId: string): Promise<CustomerDebt[]> => {
    if (window.api?.customers) return window.api.customers.listDebts(customerId)
    return fallbackDebts.filter((d) => d.customerId === customerId)
  },

  listPayments: async (customerId: string): Promise<CustomerPayment[]> => {
    if (window.api?.customers) return window.api.customers.listPayments(customerId)
    return fallbackPayments.filter((p) => p.customerId === customerId)
  },

  applyPaymentToDebt: async (input: ApplyPaymentToDebtInput): Promise<CustomerDebt> => {
    if (window.api?.customers) return window.api.customers.applyPaymentToDebt(input)
    const debt = fallbackDebts.find((d) => d.id === input.debtId)
    if (!debt) throw new Error('Deuda no encontrada.')
    if (!Number.isFinite(input.amount) || input.amount <= 0 || input.amount > debt.balance) {
      throw new Error('El monto del abono no es válido para la deuda.')
    }
    debt.balance -= input.amount
    debt.status = debt.balance === 0 ? 'PAID' : 'PARTIAL'
    const customer = fallbackCustomers.find((c) => c.id === debt.customerId)
    if (customer) customer.currentDebt = Math.max(0, customer.currentDebt - input.amount)
    fallbackPayments.push({
      id: `pay-${Date.now()}`,
      customerId: debt.customerId,
      date: new Date().toISOString(),
      amount: input.amount,
      concept: `Abono a ticket ${debt.ticketNumber}`,
      cashierName: 'Operador',
      createdAt: new Date().toISOString(),
      currency: customer?.currency ?? 'USD'
    })
    return debt
  }
}

export { cleanErrorMessage as customersErrorMessage }
