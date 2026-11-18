import type { AdjustStockInput, AdjustStockResult, KardexMovement } from '@shared/contracts'
import type { ProductRepository } from '../../ports/product.repository'
import type { StockMovementRepository } from '../../ports/stock-movement.repository'
import type { ProductBatchRepository } from '../../ports/product-batch.repository'
import type { TransactionRunner } from '../../ports/transaction'
import type { AuthService } from '../auth/auth.service'
import { NotFoundError, ValidationError } from '../shared/errors'
import { isValidProductQuantity } from '@shared/lib/product-quantity'
import { issueFromBatches } from '@shared/lib/product-batches'

/** Servicio de dominio de inventario: registra movimientos y ajusta stock. */
export class InventoryService {
  constructor(
    private readonly products: ProductRepository,
    private readonly movements: StockMovementRepository,
    private readonly batches: ProductBatchRepository,
    private readonly auth: AuthService,
    private readonly tx: TransactionRunner
  ) {}

  adjustStock(input: AdjustStockInput): AdjustStockResult {
    const user = this.auth.getSessionUser()
    if (!user) {
      throw new ValidationError('Debe iniciar sesión para ajustar el inventario.')
    }

    const product = this.products.findById(input.productId)
    if (!product) throw new NotFoundError('Producto no encontrado')

    // Los servicios no controlan existencias: ajustar sería un dato sin sentido.
    if (product.trackStock === false) {
      throw new ValidationError(
        `"${product.name}" es un servicio y no maneja stock; no se pueden registrar entradas o salidas.`
      )
    }
    // El stock de un combo se deriva de sus componentes (MIN stock/cantidad). Escribir
    // directamente en products.stock sería ignorado por la consulta efectiva: se bloquea
    // con un mensaje claro en lugar de "ajustar" sin efecto.
    if (product.typeKind === 'combo') {
      throw new ValidationError(
        `El stock de "${product.name}" se calcula desde sus componentes. Ajuste el stock de los componentes del combo.`
      )
    }

    if (!isValidProductQuantity(input.quantity, product.unit)) {
      throw new ValidationError(
        'La cantidad debe ser positiva; solo los productos medibles aceptan fracciones de hasta 3 decimales.'
      )
    }

    if (input.type !== 'ENTRADA' && input.type !== 'SALIDA') {
      throw new ValidationError('El tipo de movimiento no es válido.')
    }

    const inbound = input.type === 'ENTRADA'
    const validReason = inbound
      ? input.reason === 'ENTRADA_MASIVA' ||
        input.reason === 'INVENTARIO_INICIAL' ||
        input.reason === 'DEVOLUCION'
      : input.reason === 'SALIDA_AJUSTE' ||
        input.reason === 'MERMA' ||
        input.reason === 'DEVOLUCION'
    if (!validReason) {
      throw new ValidationError('El motivo seleccionado no corresponde al tipo de movimiento.')
    }

    const previousStock = product.stock
    if (!inbound && input.quantity > previousStock) {
      throw new ValidationError(
        `Stock insuficiente para "${product.name}". Disponible: ${previousStock}.`
      )
    }
    const newStock = inbound ? previousStock + input.quantity : previousStock - input.quantity

    const movement: KardexMovement = {
      id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      type: input.type,
      reason: input.reason,
      previousStock,
      quantity: input.quantity,
      newStock,
      responsibleUser: user.name,
      notes: input.notes
    }

    return this.tx.run(() => {
      // Productos con lotes: reflejar el ajuste en los lotes (FEFO para salidas).
      if (product.trackBatches && !inbound) {
        const batchRows = this.batches.findByProductId(product.id, true)
        const result = issueFromBatches(batchRows, input.quantity, 'FEFO')
        if (result.shortfall > 0) {
          throw new ValidationError(
            `Stock insuficiente en los lotes de "${product.name}" (faltan ${result.shortfall}).`
          )
        }
        for (const issue of result.issues) {
          const batch = this.batches.findById(issue.batchId)
          if (batch) {
            this.batches.update({
              ...batch,
              quantity: batch.quantity - issue.quantity,
              updatedAt: new Date().toISOString()
            })
          }
        }
      } else if (product.trackBatches && inbound) {
        // Entrada manual: crear un lote genérico con la fecha de hoy.
        const now = new Date().toISOString()
        this.batches.create({
          id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          productId: product.id,
          batchNumber: `AJUSTE-${now.slice(0, 10)}`,
          quantity: input.quantity,
          active: true,
          enteredAt: now,
          createdAt: now,
          updatedAt: now
        })
      }

      const updated = this.products.setStock(product.id, newStock)
      this.movements.insert(movement)
      return { product: updated, movement }
    })
  }

  listMovements(productId?: string): KardexMovement[] {
    return this.movements.findAll(productId)
  }
}
