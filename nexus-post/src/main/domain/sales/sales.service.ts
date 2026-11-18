import type { CreateSaleInput, SaleResult, SuspendedSale, KardexMovement } from '@shared/contracts'
import type { CustomerService } from '../customers/customer.service'
import type { AuthService } from '../auth/auth.service'
import type { ProductRepository } from '../../ports/product.repository'
import type { ProductPriceTierRepository } from '../../ports/product-price-tier.repository'
import type { StockMovementRepository } from '../../ports/stock-movement.repository'
import type { SalesRepository, SaleItemRecord, SaleRecord } from '../../ports/sales.repository'
import type { CashRepository } from '../../ports/cash.repository'
import type { SettingsRepository } from '../../ports/settings.repository'
import type { TransactionRunner } from '../../ports/transaction'
import { ValidationError } from '../shared/errors'
import { isValidProductQuantity } from '@shared/lib/product-quantity'
import { computeSaleTotals, resolveProductTax, type SaleLineInput } from '@shared/lib/tax'
import { resolveUnitPrice } from '@shared/lib/product-pricing'

const roundMoney = (amount: number): number => Math.round((amount + Number.EPSILON) * 100) / 100
const sameMoney = (a: number, b: number): boolean => Math.abs(roundMoney(a) - roundMoney(b)) < 0.011

export class SalesService {
  constructor(
    private readonly products: ProductRepository,
    private readonly priceTiers: ProductPriceTierRepository,
    private readonly movements: StockMovementRepository,
    private readonly sales: SalesRepository,
    private readonly cash: CashRepository,
    private readonly customers: CustomerService,
    private readonly settings: SettingsRepository,
    private readonly auth: AuthService,
    private readonly tx: TransactionRunner
  ) {}

  complete(input: CreateSaleInput): SaleResult {
    const user = this.auth.getSessionUser()
    if (!user || !user.permissions?.includes('pos')) {
      throw new Error('El usuario no tiene permiso para registrar ventas.')
    }
    if (!input.ticketNumber?.trim() || !input.items.length) {
      throw new ValidationError('El folio y al menos un producto son obligatorios.')
    }
    const activeShift = this.cash.getActiveShift(user.id)
    if (!activeShift) throw new ValidationError('Debe abrir su caja antes de cobrar una venta.')

    const config = this.settings.getBusiness()
    const seenProducts = new Set<string>()
    const items: SaleItemRecord[] = []
    const taxLines: SaleLineInput[] = []
    const now = new Date().toISOString()

    for (const line of input.items) {
      const quantity = Number(line.quantity)
      const discountPercent = Number(line.discountPercent)
      if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
        throw new ValidationError('El descuento debe estar entre 0 y 100%.')
      }
      if (discountPercent > 0 && !user.permissions?.includes('CAN_APPLY_DISCOUNT')) {
        throw new ValidationError('El usuario no tiene permiso para aplicar descuentos.')
      }
      if (seenProducts.has(line.productId)) {
        throw new ValidationError('El carrito contiene productos duplicados.')
      }
      seenProducts.add(line.productId)

      const product = this.products.findById(line.productId)
      if (!product || !product.active || product.deleted) {
        throw new ValidationError('Un producto del carrito ya no está disponible.')
      }
      if (!isValidProductQuantity(quantity, product.unit)) {
        throw new ValidationError(`La cantidad de "${product.name}" no es válida para su unidad.`)
      }
      if (!user.permissions?.includes('CAN_OVERRIDE_NO_STOCK') && quantity > product.stock) {
        throw new ValidationError(`Stock insuficiente para "${product.name}".`)
      }

      // Precio efectivo: aplica escalas de mayoreo si la cantidad lo amerita.
      const tiers = this.priceTiers.findByProductId(product.id)
      const unitPrice = resolveUnitPrice(tiers, quantity, product.salePrice)

      const lineSubtotal = unitPrice * quantity
      const lineDiscount = (lineSubtotal * discountPercent) / 100
      const lineTotal = roundMoney(lineSubtotal - lineDiscount)
      const lineTax = resolveProductTax(product, config)
      taxLines.push({
        unitPrice: product.salePrice,
        priceTiers: tiers,
        quantity,
        discountPercent,
        taxId: lineTax.taxId,
        taxName: lineTax.taxName,
        taxRate: lineTax.taxRate
      })
      items.push({
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        quantity,
        unitPrice,
        unitCost: product.costPrice,
        discountPercent,
        lineTotal
      })
    }

    const totals = computeSaleTotals(taxLines, {
      taxEnabled: config.taxEnabled,
      pricesIncludeTax: config.pricesIncludeTax
    })
    const { subtotal, discount, tax, total } = totals
    if (total <= 0) throw new ValidationError('El total de la venta debe ser mayor a cero.')

    if (
      !sameMoney(input.subtotal, subtotal) ||
      !sameMoney(input.discount, discount) ||
      !sameMoney(input.tax, tax) ||
      !sameMoney(input.total, total)
    ) {
      throw new ValidationError('El total del carrito cambió. Revise la venta antes de cobrar.')
    }
    this.validatePayment(input, total)
    if (
      input.exchangeRate !== undefined &&
      (!Number.isFinite(input.exchangeRate) || input.exchangeRate <= 0)
    ) {
      throw new ValidationError('La tasa de cambio guardada en la venta no es válida.')
    }

    const id = `sale-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const result: SaleResult = {
      id,
      cashShiftId: activeShift.id,
      ticketNumber: input.ticketNumber.trim(),
      soldAt: now,
      subtotal,
      discount,
      tax,
      total,
      customerId: input.customerId,
      taxBreakdown: totals.taxBreakdown
    }
    const sale: SaleRecord = {
      ...result,
      cashierName: user.name,
      payment: input.payment,
      exchangeRate: input.exchangeRate,
      exchangeRateUpdatedAt: input.exchangeRateUpdatedAt
    }

    return this.tx.run(() => {
      const currentShift = this.cash.getActiveShift(user.id)
      if (!currentShift || currentShift.id !== activeShift.id) {
        throw new ValidationError(
          'La caja cambió de estado. Actualice la pantalla antes de cobrar.'
        )
      }
      for (const item of items) {
        const product = this.products.findById(item.productId)
        if (
          !product ||
          !product.active ||
          product.deleted ||
          !isValidProductQuantity(item.quantity, product.unit) ||
          (!user.permissions?.includes('CAN_OVERRIDE_NO_STOCK') && item.quantity > product.stock)
        ) {
          throw new ValidationError(`Stock o disponibilidad cambió para "${item.productName}".`)
        }
        const newStock = product.stock - item.quantity
        this.products.setStock(product.id, newStock)
        const movement: KardexMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          timestamp: now,
          productId: product.id,
          productName: product.name,
          productCode: product.code,
          type: 'SALIDA',
          reason: 'VENTA',
          previousStock: product.stock,
          quantity: item.quantity,
          newStock,
          responsibleUser: user.name,
          notes: `Ticket ${result.ticketNumber}`
        }
        this.movements.insert(movement)
      }

      if (input.payment.method === 'credit') {
        this.customers.createCreditSale(input.customerId!, result.ticketNumber, total, now)
      }
      this.sales.insertSale(sale, items)
      const cashReceived =
        input.payment.method === 'cash'
          ? total
          : input.payment.method === 'mixed'
            ? (input.payment.cashAmount ?? 0)
            : 0
      if (cashReceived > 0) {
        this.cash.insertMovement({
          shiftId: activeShift.id,
          type: 'INGRESO',
          amount: cashReceived,
          cashEffect: cashReceived,
          concept: `Venta en efectivo - ticket ${result.ticketNumber}`,
          cashierName: user.name,
          source: 'SALE',
          paymentMethod: input.payment.method,
          sourceId: sale.id
        })
      }
      return result
    })
  }

  listSuspended(): SuspendedSale[] {
    const user = this.requirePosSession()
    if (!this.cash.getActiveShift(user.id)) {
      throw new ValidationError('Debe abrir su caja para consultar ventas en espera.')
    }
    return this.sales.listSuspended(user.id)
  }

  suspend(sale: SuspendedSale): void {
    const user = this.requirePosSession()
    if (!this.cash.getActiveShift(user.id)) {
      throw new ValidationError('Debe abrir su caja para pausar una venta.')
    }
    if (!sale.id || !Array.isArray(sale.items) || !sale.items.length || !sale.name) {
      throw new ValidationError('No se puede pausar una venta vacía.')
    }
    for (const item of sale.items) {
      const product = this.products.findById(item.product.id)
      if (
        !product ||
        !product.active ||
        product.deleted ||
        !isValidProductQuantity(item.quantity, product.unit)
      ) {
        throw new ValidationError('La venta en espera contiene un producto no válido.')
      }
    }
    this.sales.saveSuspended(sale, user.id)
  }

  deleteSuspended(id: string): void {
    const user = this.requirePosSession()
    if (!this.cash.getActiveShift(user.id)) {
      throw new ValidationError('Debe abrir su caja para gestionar ventas en espera.')
    }
    if (!id.trim()) throw new ValidationError('El ticket pausado no es válido.')
    this.sales.deleteSuspended(id, user.id)
  }

  private validatePayment(input: CreateSaleInput, total: number): void {
    const payment = input.payment
    if (!payment || !['cash', 'card', 'mixed', 'credit'].includes(payment.method)) {
      throw new ValidationError('El método de pago no es válido.')
    }
    if (payment.method === 'credit') {
      if (!input.customerId || payment.amountPaid !== 0 || payment.change !== 0) {
        throw new ValidationError(
          'Las ventas a crédito requieren un cliente y no reciben pago inmediato.'
        )
      }
      return
    }
    if (payment.method === 'cash') {
      if (
        !Number.isFinite(payment.amountPaid) ||
        payment.amountPaid < total ||
        !sameMoney(payment.change, payment.amountPaid - total)
      ) {
        throw new ValidationError('El efectivo recibido o el cambio no coincide con el total.')
      }
      return
    }
    if (payment.method === 'card') {
      if (!sameMoney(payment.amountPaid, total) || payment.change !== 0) {
        throw new ValidationError('El monto pagado con tarjeta debe coincidir con el total.')
      }
      return
    }
    const cash = Number(payment.cashAmount)
    const card = Number(payment.cardAmount)
    if (
      !Number.isFinite(cash) ||
      !Number.isFinite(card) ||
      cash < 0 ||
      card < 0 ||
      !sameMoney(cash + card, total) ||
      !sameMoney(payment.amountPaid, total) ||
      payment.change !== 0
    ) {
      throw new ValidationError('La suma de los pagos mixtos debe coincidir con el total.')
    }
  }

  private requirePosSession(): NonNullable<ReturnType<AuthService['getSessionUser']>> {
    const user = this.auth.getSessionUser()
    if (!user || !user.permissions?.includes('pos')) {
      throw new Error('Se requiere una sesión con permiso para acceder a las ventas.')
    }
    return user
  }
}
