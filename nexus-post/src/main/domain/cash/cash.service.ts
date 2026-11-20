import type {
  CashRegisterData,
  CashTicket,
  CreateCashMovementInput,
  OpenCashShiftInput,
  CloseCashShiftInput,
  SaleItemBatch,
  CashSaleItem,
  SalePayment
} from '@shared/contracts'
import type { AuthService } from '../auth/auth.service'
import type { CashRepository } from '../../ports/cash.repository'
import type { SalesRepository } from '../../ports/sales.repository'
import type { ProductRepository } from '../../ports/product.repository'
import type { ComboItemRepository } from '../../ports/combo-item.repository'
import type { ProductBatchRepository } from '../../ports/product-batch.repository'
import type { StockMovementRepository } from '../../ports/stock-movement.repository'
import type { TransactionRunner } from '../../ports/transaction'
import type { CustomerService } from '../customers/customer.service'
import type { SettingsRepository } from '../../ports/settings.repository'
import type { KardexMovement } from '@shared/contracts'
import { ValidationError } from '../shared/errors'

const money = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100

export class CashService {
  constructor(
    private readonly cash: CashRepository,
    private readonly sales: SalesRepository,
    private readonly products: ProductRepository,
    private readonly combos: ComboItemRepository,
    private readonly batches: ProductBatchRepository,
    private readonly movements: StockMovementRepository,
    private readonly customers: CustomerService,
    private readonly auth: AuthService,
    private readonly tx: TransactionRunner,
    private readonly settings: SettingsRepository
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
    this.tx.run(() =>
      this.cash.openShift(
        user.id,
        user.name,
        money(input.openingAmount),
        this.settings.getBusiness().currency
      )
    )
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
    if (!this.auth.hasPermission('CAN_MANUAL_CASH_MOVEMENTS')) {
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
      throw new ValidationError(
        'El gasto no puede superar el efectivo esperado disponible en caja.'
      )
    }
    this.tx.run(() =>
      this.cash.insertMovement({
        shiftId: shift.id,
        type: input.type,
        amount,
        cashEffect: input.type === 'INGRESO' ? amount : -amount,
        concept,
        cashierName: user.name,
        source: 'MANUAL',
        currency: shift.currency
      })
    )
    return this.getRegisterForUser(user)
  }

  returnSale(saleId: string): CashTicket {
    const user = this.requireCashUser()
    if (user.role !== 'ADMIN') {
      throw new Error('Solo un administrador puede devolver facturas.')
    }
    if (!saleId.trim()) throw new ValidationError('La factura seleccionada no es válida.')
    const ticket = this.sales.findTicket(saleId)
    if (!ticket) throw new ValidationError('No se encontró la factura seleccionada.')
    const resolveOpenShift = (
      currentTicket: CashTicket
    ): NonNullable<CashRegisterData['shift']> => {
      const register = this.cash.getRegister(user.id, currentTicket.shiftId, true)
      if (!register.shift?.isOpen || register.shift.id !== currentTicket.shiftId) {
        throw new ValidationError(
          'Solo se puede devolver una factura de una caja que sigue abierta.'
        )
      }
      return register.shift
    }
    resolveOpenShift(ticket)
    if (ticket.returnedAt) throw new ValidationError('La factura ya fue devuelta.')

    const returnPayment = this.getReturnPayment(ticket.payment, ticket.total)
    const cashAmount =
      ticket.payment.method === 'cash'
        ? ticket.total
        : ticket.payment.method === 'mixed'
          ? (ticket.payment.cashAmount ?? 0)
          : 0
    const returnedAt = new Date().toISOString()

    this.tx.run(() => {
      const currentTicket = this.sales.findTicket(saleId)
      if (!currentTicket || currentTicket.returnedAt) {
        throw new ValidationError('El turno o el estado de la factura cambió. Actualice la caja.')
      }
      const currentShift = resolveOpenShift(currentTicket)
      const currentRegister = this.cash.getRegister(user.id, currentShift.id, true)
      if (!currentRegister.shift || currentRegister.shift.id !== currentShift.id) {
        throw new ValidationError(
          'La caja seleccionada dejó de estar disponible. Actualice la vista.'
        )
      }
      if (cashAmount > currentRegister.shift.expectedCash) {
        throw new ValidationError('No hay efectivo suficiente en caja para completar el reintegro.')
      }

      for (const item of currentTicket.items) {
        this.restockSaleItem(
          item,
          returnedAt,
          user.name,
          currentTicket.ticketNumber,
          currentTicket.currency
        )
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
        sourceId: saleId,
        currency: currentTicket.currency
      })
    })

    const updated = this.sales.findTicket(saleId)
    if (!updated) throw new Error('La factura devuelta no pudo volver a cargarse.')
    return updated
  }

  /**
   * Repone el stock de una línea devuelta.
   * - Combo: repone sus COMPONENTES (fueron los que se descontaron al cobrar),
   *   no el producto combo (que nunca se descontó).
   * - Producto con lotes: repone los lotes exactos descontados en la venta;
   *   si la venta es anterior a la trazabilidad, crea un lote de devolución.
   */
  private restockSaleItem(
    item: CashSaleItem,
    returnedAt: string,
    responsibleUser: string,
    ticketNumber: string,
    currency: KardexMovement['currency']
  ): void {
    if (item.isCombo && item.comboId) {
      const components = this.combos
        .findByComboId(item.comboId)
        .filter((c) => c.active && !c.deleted)
      for (const component of components) {
        const componentProduct = this.products.findById(component.componentId)
        if (!componentProduct || componentProduct.trackStock === false) continue
        const saleUnitCost = this.movements.findSaleUnitCost(ticketNumber, componentProduct.id)
        this.restockProduct(
          componentProduct,
          component.quantity * item.quantity,
          'COMBO',
          item.batches,
          returnedAt,
          responsibleUser,
          `Devolución de combo "${item.productName}" (ticket ${ticketNumber})`,
          ticketNumber,
          saleUnitCost ?? componentProduct.costPrice,
          saleUnitCost === null ? 'PRODUCT_COST' : 'SALE_SNAPSHOT',
          currency
        )
      }
      return
    }

    const product = this.products.findById(item.productId)
    if (!product) {
      throw new ValidationError(`No se puede reponer "${item.productName}": producto inexistente.`)
    }
    this.restockProduct(
      product,
      item.quantity,
      'DEVOLUCION',
      item.batches,
      returnedAt,
      responsibleUser,
      `Devolución completa de ticket ${ticketNumber}`,
      ticketNumber,
      item.unitCost,
      'SALE_SNAPSHOT',
      currency
    )
  }

  /** Repone cantidad sobre un producto, respetando lotes si los controla. */
  private restockProduct(
    product: NonNullable<ReturnType<ProductRepository['findById']>>,
    quantity: number,
    reason: 'DEVOLUCION' | 'COMBO',
    recordedBatches: SaleItemBatch[] | undefined,
    returnedAt: string,
    responsibleUser: string,
    notes: string,
    reference: string,
    unitCost: number,
    valuationBasis: 'SALE_SNAPSHOT' | 'PRODUCT_COST',
    currency: KardexMovement['currency']
  ): void {
    let runningStock = product.stock

    if (product.trackBatches) {
      const saved = (recordedBatches ?? []).filter((b) => b.productId === product.id)
      if (saved.length > 0) {
        for (const entry of saved) {
          const batch = this.batches.findById(entry.batchId)
          if (batch) {
            this.batches.update({
              ...batch,
              quantity: batch.quantity + entry.quantity,
              updatedAt: returnedAt
            })
          } else {
            const now = returnedAt
            this.batches.create({
              id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              productId: product.id,
              batchNumber: entry.batchNumber,
              quantity: entry.quantity,
              active: true,
              enteredAt: now,
              createdAt: now,
              updatedAt: now
            })
          }
          this.insertRestockMovement(
            product,
            entry.quantity,
            reason,
            `${notes} · Lote ${entry.batchNumber}`,
            runningStock,
            runningStock + entry.quantity,
            returnedAt,
            responsibleUser,
            reference,
            unitCost,
            valuationBasis,
            currency,
            entry.batchNumber
          )
          runningStock += entry.quantity
        }
      } else {
        // Venta histórica sin trazabilidad de lotes: se crea un lote de devolución
        // para que el stock efectivo (SUM de lotes) realmente aumente.
        const now = returnedAt
        const returnBatchNumber = `DEVOLUCION-${now.slice(0, 10)}`
        this.batches.create({
          id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          productId: product.id,
          batchNumber: returnBatchNumber,
          quantity,
          active: true,
          enteredAt: now,
          createdAt: now,
          updatedAt: now
        })
        this.insertRestockMovement(
          product,
          quantity,
          reason,
          notes,
          runningStock,
          runningStock + quantity,
          returnedAt,
          responsibleUser,
          reference,
          unitCost,
          valuationBasis,
          currency,
          returnBatchNumber
        )
        runningStock += quantity
      }
    } else {
      this.insertRestockMovement(
        product,
        quantity,
        reason,
        notes,
        runningStock,
        runningStock + quantity,
        returnedAt,
        responsibleUser,
        reference,
        unitCost,
        valuationBasis,
        currency,
        undefined
      )
      runningStock += quantity
    }

    this.products.setStock(product.id, runningStock)
  }

  private insertRestockMovement(
    product: NonNullable<ReturnType<ProductRepository['findById']>>,
    quantity: number,
    reason: 'DEVOLUCION' | 'COMBO',
    notes: string,
    previousStock: number,
    newStock: number,
    timestamp: string,
    responsibleUser: string,
    reference: string,
    unitCost: number,
    valuationBasis: 'SALE_SNAPSHOT' | 'PRODUCT_COST',
    currency: KardexMovement['currency'],
    batchNumber?: string
  ): void {
    const movement: KardexMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp,
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      type: 'ENTRADA',
      reason,
      previousStock,
      quantity,
      newStock,
      responsibleUser,
      notes,
      source: 'CASH',
      unit: product.unit,
      reference,
      batchNumber,
      unitCost,
      valuationBasis,
      currency
    }
    this.movements.insert(movement)
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
    if (!user || !this.auth.hasPermission('cash')) {
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
