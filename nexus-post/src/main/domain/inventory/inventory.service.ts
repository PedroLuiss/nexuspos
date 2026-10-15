import type { AdjustStockInput, AdjustStockResult, KardexMovement } from '@shared/contracts'
import { isInboundReason } from '@shared/contracts'
import type { ProductRepository } from '../../ports/product.repository'
import type { StockMovementRepository } from '../../ports/stock-movement.repository'
import type { TransactionRunner } from '../../ports/transaction'
import { NotFoundError, ValidationError } from '../shared/errors'

/** Servicio de dominio de inventario: registra movimientos y ajusta stock. */
export class InventoryService {
  constructor(
    private readonly products: ProductRepository,
    private readonly movements: StockMovementRepository,
    private readonly tx: TransactionRunner
  ) {}

  adjustStock(input: AdjustStockInput): AdjustStockResult {
    const product = this.products.findById(input.productId)
    if (!product) throw new NotFoundError('Producto no encontrado')
    if (!(input.quantity > 0)) throw new ValidationError('La cantidad debe ser mayor a 0')

    const inbound = isInboundReason(input.reason)
    const previousStock = product.stock
    const newStock = inbound
      ? previousStock + input.quantity
      : Math.max(0, previousStock - input.quantity)

    const movement: KardexMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      type: inbound ? 'ENTRADA' : 'SALIDA',
      reason: input.reason,
      previousStock,
      quantity: input.quantity,
      newStock,
      responsibleUser: input.responsibleUser,
      notes: input.notes
    }

    return this.tx.run(() => {
      const updated = this.products.setStock(product.id, newStock)
      this.movements.insert(movement)
      return { product: updated, movement }
    })
  }

  listMovements(productId?: string): KardexMovement[] {
    return this.movements.findAll(productId)
  }
}
