import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '@shared/contracts'
import type {
  CustomerInput,
  CustomerUpdateInput,
  CustomerFilter,
  CustomerPaymentInput,
  ApplyPaymentToDebtInput
} from '@shared/contracts'
import type { CustomerService } from '../domain/customers/customer.service'

/**
 * Canales IPC de clientes, crédito y cobranza.
 * - Lectura (list, getById, account summary, debts, payments): disponible para cualquier sesión autenticada.
 * - Escritura (create, update, delete, toggleStatus, recordPayment, applyPaymentToDebt):
 *   requiere rol ADMIN o CASHIER según la operación (validado en CustomerService).
 */
export function registerCustomerIpc(customerService: CustomerService): void {
  ipcMain.handle(IPC_CHANNELS.customers.list, async (_event, filter?: CustomerFilter) => {
    return customerService.list(filter)
  })

  ipcMain.handle(IPC_CHANNELS.customers.getById, async (_event, id: string) => {
    return customerService.getById(id)
  })

  ipcMain.handle(IPC_CHANNELS.customers.create, async (_event, input: CustomerInput) => {
    return customerService.create(input)
  })

  ipcMain.handle(IPC_CHANNELS.customers.update, async (_event, input: CustomerUpdateInput) => {
    return customerService.update(input)
  })

  ipcMain.handle(IPC_CHANNELS.customers.delete, async (_event, id: string) => {
    return customerService.delete(id)
  })

  ipcMain.handle(IPC_CHANNELS.customers.toggleStatus, async (_event, id: string) => {
    return customerService.toggleStatus(id)
  })

  ipcMain.handle(IPC_CHANNELS.customers.getAccountSummary, async (_event, customerId: string) => {
    return customerService.getAccountSummary(customerId)
  })

  ipcMain.handle(
    IPC_CHANNELS.customers.recordPayment,
    async (_event, input: CustomerPaymentInput) => {
      return customerService.recordPayment(input.customerId, input.amount, input.concept)
    }
  )

  ipcMain.handle(IPC_CHANNELS.customers.listDebts, async (_event, customerId: string) => {
    return customerService.listDebts(customerId)
  })

  ipcMain.handle(IPC_CHANNELS.customers.listPayments, async (_event, customerId: string) => {
    return customerService.listPayments(customerId)
  })

  ipcMain.handle(
    IPC_CHANNELS.customers.applyPaymentToDebt,
    async (_event, input: ApplyPaymentToDebtInput) => {
      return customerService.applyPaymentToDebt(input.debtId, input.amount)
    }
  )
}
