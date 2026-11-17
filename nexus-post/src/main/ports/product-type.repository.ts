import type { ProductType, ProductTypeInput, ProductTypeFilter } from '@shared/contracts'

/**
 * Puerto de persistencia de tipos de producto.
 * La implementación concreta (SQLite) vive en `main/adapters`.
 */
export interface ProductTypeRepository {
  findAll(filter?: ProductTypeFilter): ProductType[]
  findById(id: string): ProductType | null
  findByName(name: string): ProductType | null
  create(input: ProductTypeInput & { id: string; createdAt: string; updatedAt: string }): ProductType
  update(type: ProductType): ProductType
  softDelete(id: string): void
  toggleStatus(id: string): ProductType
}
