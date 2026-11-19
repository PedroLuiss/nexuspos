/**
 * Contrato compartido de Clientes y Crédito/Cobranza.
 * Fuente única de verdad entre `main`, `preload` y `renderer`.
 * No debe importar Electron, SQLite ni React.
 */

/** Datos de un cliente en el directorio. */
export interface Customer {
  id: string
  code: string
  name: string
  taxId: string
  phone: string
  email: string
  address: string
  creditLimit: number
  currentDebt: number
  creditBalance?: number
  active: boolean
  deleted?: boolean
  createdAt?: string
  updatedAt?: string
}

/** Datos de entrada para crear un cliente. */
export type CustomerInput = Omit<
  Customer,
  'id' | 'currentDebt' | 'active' | 'deleted' | 'createdAt' | 'updatedAt'
>

/** Datos de entrada para actualizar un cliente. */
export type CustomerUpdateInput = Partial<CustomerInput> & { id: string }

/** Filtros para listar clientes. */
export interface CustomerFilter {
  search?: string
  includeInactive?: boolean
  onlyWithDebt?: boolean
  onlyActive?: boolean
}

/** Deuda pendiente de un cliente (ticket con saldo). */
export interface CustomerDebt {
  id: string
  customerId: string
  ticketNumber: string
  date: string
  totalAmount: number
  balance: number
  status: 'PENDING' | 'PARTIAL' | 'PAID'
}

/** Pago / abono registrado a la cuenta de un cliente. */
export interface CustomerPayment {
  id: string
  customerId: string
  date: string
  amount: number
  concept: string
  cashierName: string
  cashShiftId?: string
  createdAt: string
}

/** Resumen de cuenta de cliente para el estado de cuenta. */
export interface CustomerAccountSummary {
  customer: Customer
  totalDebt: number
  totalPaid: number
  availableCredit: number
  customerCreditBalance: number
  debts: CustomerDebt[]
  payments: CustomerPayment[]
}

export interface CustomerPaymentInput {
  customerId: string
  amount: number
  concept: string
}

export interface ApplyPaymentToDebtInput {
  debtId: string
  amount: number
}

/** Puerto de API de clientes. */
export interface CustomersApi {
  list(filter?: CustomerFilter): Promise<Customer[]>
  getById(id: string): Promise<Customer | null>
  create(input: CustomerInput): Promise<Customer>
  update(input: CustomerUpdateInput): Promise<Customer>
  delete(id: string): Promise<void>
  toggleStatus(id: string): Promise<Customer>
  getAccountSummary(customerId: string): Promise<CustomerAccountSummary | null>
  recordPayment(input: CustomerPaymentInput): Promise<CustomerPayment>
  listDebts(customerId: string): Promise<CustomerDebt[]>
  listPayments(customerId: string): Promise<CustomerPayment[]>
  applyPaymentToDebt(input: ApplyPaymentToDebtInput): Promise<CustomerDebt>
}
