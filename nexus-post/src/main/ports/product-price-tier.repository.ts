import type {
  ProductPriceTier,
  ProductPriceTierInput,
  ProductPriceTierFilter
} from '@shared/contracts'

/**
 * Puerto de persistencia de precios por mayoreo (price tiers).
 * La implementación concreta (SQLite) vive en `main/adapters`.
 */
export interface ProductPriceTierRepository {
  findAll(filter?: ProductPriceTierFilter): ProductPriceTier[]
  findById(id: string): ProductPriceTier | null
  findByProductId(productId: string): ProductPriceTier[]
  create(
    input: ProductPriceTierInput & { id: string; createdAt: string; updatedAt: string }
  ): ProductPriceTier
  update(tier: ProductPriceTier): ProductPriceTier
  softDelete(id: string): void
  toggleStatus(id: string): ProductPriceTier
}
