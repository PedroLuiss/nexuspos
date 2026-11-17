import type { Supplier, SupplierInput, SupplierFilter } from '@shared/contracts'

/**
 * Puerto de persistencia de proveedores.
 * La implementación concreta (SQLite) vive en `main/adapters`.
 */
export interface SupplierRepository {
  findAll(filter?: SupplierFilter): Supplier[]
  findById(id: string): Supplier | null
  findByName(name: string): Supplier | null
  create(input: SupplierInput & { id: string; createdAt: string; updatedAt: string }): Supplier
  update(supplier: Supplier): Supplier
  softDelete(id: string): void
  toggleStatus(id: string): Supplier
}
