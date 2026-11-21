import { useMemo } from 'react'
import type { Brand, ProductType, Supplier, TaxRate } from '@shared/contracts'
import { formatTaxLabel } from '@shared/lib/tax'

export interface TaxFilterOption {
  value: string
  label: string
}

export function useProductFilterOptions(
  taxes: TaxRate[],
  brands: Brand[],
  suppliers: Supplier[],
  types: ProductType[]
): {
  taxOptions: TaxFilterOption[]
  brandOptions: TaxFilterOption[]
  supplierOptions: TaxFilterOption[]
  typeOptions: TaxFilterOption[]
} {
  const taxOptions = useMemo(
    () => [
      ...taxes.map((tax) => ({ value: tax.id, label: formatTaxLabel(tax.name, tax.rate) })),
      { value: 'NONE', label: 'Sin tasa asignada' }
    ],
    [taxes]
  )
  const brandOptions = useMemo(
    () => [
      ...brands.map((brand) => ({ value: brand.id, label: brand.name })),
      { value: 'NONE', label: 'Sin marca asignada' }
    ],
    [brands]
  )
  const supplierOptions = useMemo(
    () => [
      ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
      { value: 'NONE', label: 'Sin proveedor asignado' }
    ],
    [suppliers]
  )
  const typeOptions = useMemo(
    () => [
      ...types.map((type) => ({ value: type.id, label: type.name })),
      { value: 'NONE', label: 'Sin tipo asignado' }
    ],
    [types]
  )

  return { taxOptions, brandOptions, supplierOptions, typeOptions }
}
