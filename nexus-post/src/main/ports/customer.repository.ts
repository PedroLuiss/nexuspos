import type {
  Customer,
  CustomerInput,
  CustomerUpdateInput,
  CustomerFilter
} from '@shared/contracts'
import type { CustomerDebt, CustomerPayment, CustomerAccountSummary } from '@shared/contracts'

/**
 * Puerto de persistencia de clientes y crédito/cobranza.
 * La implementación concreta vive en `main/adapters/persistence/sqlite/`.
 */
export interface CustomerRepository {
  /** Lista todos los clientes con filtros opcionales. */
  list(filter?: CustomerFilter): Customer[]
  /** Obtiene un cliente por su id. */
  getById(id: string): Customer | null
  /** Crea un nuevo cliente. */
  create(input: CustomerInput): Customer
  /** Actualiza los datos de un cliente existente. */
  update(input: CustomerUpdateInput): Customer
  /** Baja lógica del cliente (soft delete). */
  delete(id: string): void
  /** Activa / desactiva la cuenta del cliente. */
  toggleStatus(id: string): Customer
  /** Obtiene el resumen de cuenta del cliente (deudas, pagos, crédito disponible). */
  getAccountSummary(customerId: string): CustomerAccountSummary | null
  /** Registra un abono/pago a la cuenta de un cliente. */
  recordPayment(
    customerId: string,
    amount: number,
    concept: string,
    cashierName: string,
    cashShiftId: string
  ): CustomerPayment
  /** Lista las deudas pendientes de un cliente. */
  listDebts(customerId: string): CustomerDebt[]
  /** Lista los pagos realizados por un cliente. */
  listPayments(customerId: string): CustomerPayment[]
  /** Asocia una venta a crédito a un cliente (crea una deuda). */
  createCreditSale(
    customerId: string,
    ticketNumber: string,
    totalAmount: number,
    date: string
  ): CustomerDebt
  /** Abona a una deuda específica de un cliente. */
  applyPaymentToDebt(
    debtId: string,
    amount: number,
    cashierName: string,
    cashShiftId: string
  ): CustomerDebt
  refundCreditSale(customerId: string, ticketNumber: string, totalAmount: number): void
}
