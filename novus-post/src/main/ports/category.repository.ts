import type { Category, CategoryInput, CategoryFilter } from '@shared/contracts'

/**
 * Puerto de persistencia de categorías.
 * La implementación concreta (SQLite) vive en `main/adapters`.
 */
export interface CategoryRepository {
  findAll(filter?: CategoryFilter): Category[]
  findById(id: string): Category | null
  findByName(name: string): Category | null
  create(input: CategoryInput & { id: string; createdAt: string; updatedAt: string }): Category
  update(category: Category): Category
  softDelete(id: string): void
  toggleStatus(id: string): Category
}
