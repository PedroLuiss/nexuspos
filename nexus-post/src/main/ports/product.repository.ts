import type { Product, ProductInput, ProductFilter } from '@shared/contracts'

/**
 * Puerto de persistencia de productos.
 * La implementación concreta (SQLite) vive en `main/adapters`.
 */
export interface ProductRepository {
  findAll(filter?: ProductFilter): Product[]
  findById(id: string): Product | null
  findByCode(code: string): Product | null
  create(input: ProductInput & { id: string; createdAt: string; updatedAt: string }): Product
  update(product: Product): Product
  softDelete(id: string): void
  toggleStatus(id: string): Product
  setStock(id: string, stock: number): Product
}
