import type {
  CashRegisterData,
  CashTicket,
  CreateCashMovementInput,
  OpenCashShiftInput,
  CloseCashShiftInput,
  SalePayment
} from '@shared/contracts'
import type { AuthService } from '../auth/auth.service'
import type { CashRepository } from '../../ports/cash.repository'
import type { SalesRepository } from '../../ports/sales.repository'
import type { ProductRepository } from '../../ports/product.repository'
import type { StockMovementRepository } from '../../ports/stock-movement.repository'
import type { TransactionRunner } from '../../ports/transaction'
import type { CustomerService } from '../customers/customer.service'
import type { KardexMovement } from '@shared/contracts'
import { ValidationError } from '../shared/errors'

const money = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100

export class CashService {
  constructor(
    private readonly cash: CashRepository,
    private readonly sales: SalesRepository,
    private readonly products: ProductRepository,
    private readonly movements: StockMovementRepository,
    private readonly customers: CustomerService,
    private readonly auth: AuthService,
    private readonly tx: TransactionRunner
  ) {}

  getRegister(shiftId?: string): CashRegisterData {
    const user = this.requireCashUser()
    return this.getRegisterForUser(user, shiftId)
  }

  openShift(input: OpenCashShiftInput): CashRegisterData {
    const user = this.requireCashUser()
    if (!Number.isFinite(input.openingAmount) || input.openingAmount < 0) {
      throw new ValidationError('El fondo inicial debe ser un monto igual o mayor a cero.')
    }
    if (this.cash.getActiveShift(user.id)) {
      throw new ValidationError('Ya existe una caja abierta para este usuario.')
    }
    this.tx.run(() => this.cash.openShift(user.id, user.name, money(input.openingAmount)))
    return this.getRegisterForUser(user)
  }

  closeShift(input: CloseCashShiftInput): CashRegisterData {
    const user = this.requireCashUser()
    if (!Number.isFinite(input.countedCash) || input.countedCash < 0) {
      throw new ValidationError('El efectivo contado debe ser un monto igual o mayor a cero.')
    }
    const active = this.requireOpenShift(user.id)
    const current = this.getRegisterForUser(user)
    if (!current.shift || current.shift.id !== active.id) {
      throw new Error('No se pudo cargar el turno activo para realizar el cierre.')
    }
    const counted = money(input.countedCash)
    const expected = current.shift.expectedCash
    this.tx.run(() =>
      this.cash.closeShift(
        active.id,
        new Date().toISOString(),
        expected,
        counted,
        money(counted - expected)
      )
    )
    return this.getRegisterForUser(user)
  }

  addMovement(input: CreateCashMovementInput): CashRegisterData {
    const user = this.requireCashUser()
    if (!user.permissions?.includes('CAN_MANUAL_CASH_MOVEMENTS')) {
      throw new Error('El usuario no tiene permiso para registrar movimientos manuales de caja.')
    }
    if (!['INGRESO', 'EGRESO'].includes(input.type)) {
      throw new ValidationError('El tipo de movimiento no es válido.')
    }
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new ValidationError('El monto del movimiento debe ser mayor a cero.')
    }
    const concept = input.concept.trim()
    if (!concept) throw new ValidationError('La justificación del movimiento es obligatoria.')
    const shift = this.requireOpenShift(user.id)
    const amount = money(input.amount)
    const register = this.getRegisterForUser(user)
    if (!register.shift || register.shift.id !== shift.id) {
      throw new Error('No se pudo cargar la caja activa para registrar el movimiento.')
    }
    if (input.type === 'EGRESO' && amount > register.shift.expectedCash) {
      throw new ValidationError('El gasto no puede superar el efectivo esperado disponible en caja.')
    }
    this.tx.run(() =>
      this.cash.insertMovement({
        shiftId: shift.id,
        type: input.type,
        amount,
        cashEffect: input.type === 'INGRESO' ? amount : -amount,
        concept,
        cashierName: user.name,
        source: 'MANUAL'
      })
    )
    return this.getRegisterForUser(user)
  }

  returnSale(saleId: string): CashTicket {
    const user = this.requireCashUser()
    if (user.role !== 'CASHIER' && user.role !== 'ADMIN') {
      throw new Error('Solo un cajero o administrador puede devolver facturas.')
    }
    if (!saleId.trim()) throw new ValidationError('La factura seleccionada no es válida.')
    const shift = this.requireOpenShift(user.id)
    const ticket = this.sales.findTicket(saleId)
    if (!ticket) throw new ValidationError('No se encontró la factura seleccionada.')
    if (ticket.shiftId !== shift.id) {
      throw new Error('Solo se puede devolver una factura de la caja abierta de este usuario.')
    }
    if (ticket.returnedAt) throw new ValidationError('La factura ya fue devuelta.')

    const returnPayment = this.getReturnPayment(ticket.payment, ticket.total)
    const cashAmount = ticket.payment.method === 'cash'
      ? ticket.total
      : ticket.payment.method === 'mixed'
        ? ticket.payment.cashAmount ?? 0
        : 0
    const returnedAt = new Date().toISOString()

    this.tx.run(() => {
      const currentShift = this.requireOpenShift(user.id)
      const currentTicket = this.sales.findTicket(saleId)
      if (!currentTicket || currentTicket.shiftId !== currentShift.id || currentTicket.returnedAt) {
        throw new ValidationError('El turno o el estado de la factura cambió. Actualice la caja.')
      }
      const currentRegister = this.getRegisterForUser(user)
      if (!currentRegister.shift || currentRegister.shift.id !== currentShift.id) {
        throw new Error('No se pudo cargar la caja activa para devolver la factura.')
      }
      if (cashAmount > currentRegister.shift.expectedCash) {
        throw new ValidationError('No hay efectivo suficiente en caja para completar el reintegro.')
      }

      for (const item of currentTicket.items) {
        const product = this.products.findById(item.productId)
        if (!product) {
          throw new ValidationError(`No se puede reponer "${item.productName}": producto inexistente.`)
        }
        const newStock = product.stock + item.quantity
        this.products.setStock(product.id, newStock)
        const movement: KardexMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: returnedAt,
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          type: 'ENTRADA',
          reason: 'DEVOLUCION',
          previousStock: product.stock,
          quantity: item.quantity,
          newStock,
          responsibleUser: user.name,
          notes: `Devolución completa de ticket ${currentTicket.ticketNumber}`
        }
        this.movements.insert(movement)
      }

      if (currentTicket.payment.method === 'credit' && currentTicket.customerId) {
        this.customers.refundCreditSale(
          currentTicket.customerId,
          currentTicket.ticketNumber,
          currentTicket.total
        )
      }
      this.sales.markReturned(saleId, returnedAt, returnPayment, cashAmount)
      this.cash.insertRefund(
        saleId,
        currentShift.id,
        user.id,
        returnedAt,
        currentTicket.total,
        returnPayment,
        cashAmount
      )
      this.cash.insertMovement({
        shiftId: currentShift.id,
        type: 'DEVOLUCION',
        amount: currentTicket.total,
        cashEffect: -cashAmount,
        concept: `Devolución de ticket ${currentTicket.ticketNumber}`,
        cashierName: user.name,
        source: 'SALE_REFUND',
        paymentMethod: currentTicket.payment.method,
        sourceId: saleId
      })
    })

    const updated = this.sales.findTicket(saleId)
    if (!updated) throw new Error('La factura devuelta no pudo volver a cargarse.')
    return updated
  }

  private getReturnPayment(original: SalePayment, total: number): SalePayment {
    if (original.method === 'credit') {
      return { method: 'credit', amountPaid: 0, change: 0 }
    }
    if (original.method === 'mixed') {
      return {
        method: 'mixed',
        amountPaid: total,
        change: 0,
        cashAmount: original.cashAmount,
        cardAmount: original.cardAmount
      }
    }
    return { method: original.method, amountPaid: total, change: 0 }
  }

  private requireCashUser(): NonNullable<ReturnType<AuthService['getSessionUser']>> {
    const user = this.auth.getSessionUser()
    if (!user || !user.permissions?.includes('cash')) {
      throw new Error('Se requiere una sesión con permiso para acceder a la caja.')
    }
    return user
  }

  private requireOpenShift(
    cashierId: string
  ): NonNullable<ReturnType<CashRepository['getActiveShift']>> {
    const shift = this.cash.getActiveShift(cashierId)
    if (!shift) throw new Error('Debe abrir su caja antes de realizar esta operación.')
    return shift
  }

  private getRegisterForUser(
    user: NonNullable<ReturnType<AuthService['getSessionUser']>>,
    shiftId?: string
  ): CashRegisterData {
    return this.cash.getRegister(user.id, shiftId, user.role === 'ADMIN')
  }
}
