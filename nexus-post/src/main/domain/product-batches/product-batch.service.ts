import type {
  ProductBatch,
  ProductBatchInput,
  ProductBatchFilter,
  KardexMovement
} from '@shared/contracts'
import type { ProductBatchRepository } from '../../ports/product-batch.repository'
import type { ProductRepository } from '../../ports/product.repository'
import type { BatchIssueResult } from '@shared/lib/product-batches'
import { issueFromBatches } from '@shared/lib/product-batches'
import { NotFoundError, ValidationError } from '../shared/errors'
import { normalizeProductBatchInput, validateProductBatchInput } from './product-batch.entity'

/**
 * Servicio de dominio de lotes. Puro: solo depende de puertos y utilidades compartidas.
 * Gestiona entradas de lotes y salidas FEFO (First Expired, First Out).
 */
export class ProductBatchService {
  constructor(
    private readonly batches: ProductBatchRepository,
    private readonly products: ProductRepository
  ) {}

  list(filter?: ProductBatchFilter): ProductBatch[] {
    return this.batches.findAll(filter)
  }

  getById(id: string): ProductBatch | null {
    return this.batches.findById(id)
  }

  findByProductId(productId: string, onlyWithStock = true): ProductBatch[] {
    return this.batches.findByProductId(productId, onlyWithStock)
  }

  totalStock(productId: string): number {
    return this.batches.totalStock(productId)
  }

  /** Registra una entrada de lote y suma su cantidad al stock del producto. */
  receive(input: ProductBatchInput): ProductBatch {
    const errors = validateProductBatchInput(input)
    if (errors.length > 0) throw new ValidationError(errors.join('. '))
    const normalized = normalizeProductBatchInput(input)

    const product = this.products.findById(normalized.productId)
    if (!product || product.deleted) throw new ValidationError('El producto no existe')

    const duplicate = this.batches
      .findByProductId(normalized.productId, false)
      .find((b) => b.batchNumber.toLowerCase() === normalized.batchNumber.toLowerCase())
    if (duplicate) {
      throw new ValidationError(`El lote "${normalized.batchNumber}" ya existe para este producto`)
    }

    const now = new Date().toISOString()
    const batch = this.batches.create({
      ...normalized,
      id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      enteredAt: now,
      createdAt: now,
      updatedAt: now
    })
    if (normalized.quantity > 0) {
      this.products.setStock(product.id, product.stock + normalized.quantity)
    }
    return batch
  }

  update(batch: ProductBatch): ProductBatch {
    const existing = this.batches.findById(batch.id)
    if (!existing) throw new NotFoundError('Lote no encontrado')

    const errors = validateProductBatchInput(batch)
    if (errors.length > 0) throw new ValidationError(errors.join('; '))
    const normalized = normalizeProductBatchInput(batch)

    return this.batches.update({ ...existing, ...normalized, id: batch.id })
  }

  softDelete(id: string): void {
    if (!this.batches.findById(id)) throw new NotFoundError('Lote no encontrado')
    this.batches.softDelete(id)
  }

  /**
   * Descuenta una cantidad de los lotes FEFO.
   * Devuelve el desglose de lotes consumidos. Si no hay stock suficiente, lanza error.
   * NOTA: el llamador es responsable de actualizar el stock del producto y el Kardex
   * dentro de su transacción (esta función solo calcula y ajusta los lotes).
   */
  issue(productId: string, quantity: number): BatchIssueResult {
    const candidates = this.batches.findByProductId(productId, true)
    const result = issueFromBatches(candidates, quantity, 'FEFO')
    if (result.shortfall > 0) {
      throw new ValidationError(
        `Stock insuficiente en los lotes de este producto (faltan ${result.shortfall}).`
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
    return result
  }

  /** Crea un lote inicial con el stock actual del producto (al activar control de lotes). */
  ensureInitialBatch(productId: string): void {
    const product = this.products.findById(productId)
    if (!product) throw new ValidationError('El producto no existe')
    const existing = this.batches.findByProductId(productId, false)
    if (existing.length > 0) return

    const now = new Date().toISOString()
    this.batches.create({
      id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      productId,
      batchNumber: `INICIAL-${now.slice(0, 10)}`,
      quantity: product.stock,
      expirationDate: undefined,
      active: true,
      enteredAt: now,
      createdAt: now,
      updatedAt: now
    })
  }

  /** Construye los movimientos Kardex por lote consumido (para auditoría). */
  buildIssueMovements(
    productId: string,
    issues: BatchIssueResult['issues'],
    base: Omit<
      KardexMovement,
      'id' | 'quantity' | 'previousStock' | 'newStock' | 'notes' | 'batchNumber'
    >
  ): KardexMovement[] {
    return issues.map((issue) => ({
      ...base,
      id: `mov-lot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      quantity: issue.quantity,
      previousStock: 0,
      newStock: 0,
      batchNumber: issue.batchNumber,
      notes: `Lote ${issue.batchNumber}`
    }))
  }
}
