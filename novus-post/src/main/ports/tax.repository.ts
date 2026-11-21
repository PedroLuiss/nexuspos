import type { TaxInput, TaxRate } from '@shared/contracts'

/** Puerto de persistencia del catálogo de impuestos. */
export interface TaxRepository {
  findAll(includeInactive?: boolean): TaxRate[]
  findById(id: string): TaxRate | null
  findByName(name: string): TaxRate | null
  findDefault(): TaxRate | null
  create(input: TaxInput & { id: string; createdAt: string; updatedAt: string }): TaxRate
  update(tax: TaxRate): TaxRate
  softDelete(id: string): void
  setDefault(id: string): TaxRate
  countProducts(taxId: string): number
}
