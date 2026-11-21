import type { Brand, BrandInput, BrandFilter } from '@shared/contracts'

/**
 * Puerto de persistencia de marcas.
 * La implementación concreta (SQLite) vive en `main/adapters`.
 */
export interface BrandRepository {
  findAll(filter?: BrandFilter): Brand[]
  findById(id: string): Brand | null
  findByName(name: string): Brand | null
  create(input: BrandInput & { id: string; createdAt: string; updatedAt: string }): Brand
  update(brand: Brand): Brand
  softDelete(id: string): void
  toggleStatus(id: string): Brand
}
