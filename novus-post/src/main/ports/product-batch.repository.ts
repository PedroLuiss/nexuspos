import type {
  ProductBatch,
  ProductBatchInput,
  ProductBatchFilter
} from '@shared/contracts'

/** Puerto de persistencia de lotes de producto. */
export interface ProductBatchRepository {
  findAll(filter?: ProductBatchFilter): ProductBatch[]
  findById(id: string): ProductBatch | null
  findByProductId(productId: string, onlyWithStock?: boolean): ProductBatch[]
  create(input: ProductBatchInput & { id: string; enteredAt: string; createdAt: string; updatedAt: string }): ProductBatch
  update(batch: ProductBatch): ProductBatch
  softDelete(id: string): void
  /** Suma de cantidades de los lotes activos de un producto. */
  totalStock(productId: string): number
}
