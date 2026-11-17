import { useMemo, useState } from 'react'
import type {
  Brand,
  Product,
  Supplier,
  TaxRate,
  ProductType
} from '@shared/contracts'
import { formatTaxLabel } from '@shared/lib/tax'

export type StockFilter = 'ALL' | 'LOW' | 'OUT'

export interface TaxFilterOption {
  value: string
  label: string
}

export interface ProductStats {
  total: number
  totalStock: number
  totalValue: number
  lowStock: number
  outOfStock: number
}

export interface UseProductFiltersResult {
  searchTerm: string
  setSearchTerm: (value: string) => void
  selectedCategory: string
  setSelectedCategory: (value: string) => void
  stockFilter: StockFilter
  setStockFilter: (value: StockFilter) => void
  taxFilter: string
  setTaxFilter: (value: string) => void
  taxOptions: TaxFilterOption[]
  brandFilter: string
  setBrandFilter: (value: string) => void
  brandOptions: TaxFilterOption[]
  supplierFilter: string
  setSupplierFilter: (value: string) => void
  supplierOptions: TaxFilterOption[]
  typeFilter: string
  setTypeFilter: (value: string) => void
  typeOptions: TaxFilterOption[]
  categories: string[]
  filtered: Product[]
  stats: ProductStats
}

/** Filtrado y métricas del catálogo, calculados en memoria. */
export function useProductFilters(
  products: Product[],
  taxes: TaxRate[] = [],
  brands: Brand[] = [],
  suppliers: Supplier[] = [],
  types: ProductType[] = []
): UseProductFiltersResult {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL')
  const [taxFilter, setTaxFilter] = useState('ALL')
  const [brandFilter, setBrandFilter] = useState('ALL')
  const [supplierFilter, setSupplierFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  const categories = useMemo(
    () => ['ALL', ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  )

  const taxOptions = useMemo<TaxFilterOption[]>(() => {
    const options = taxes
      .filter((tax) => tax.active || products.some((p) => p.taxId === tax.id))
      .map((tax) => ({ value: tax.id, label: formatTaxLabel(tax.name, tax.rate) }))
    if (products.some((p) => !p.taxId)) {
      options.push({ value: 'NONE', label: 'Sin tasa asignada' })
    }
    return options
  }, [taxes, products])

  const brandOptions = useMemo<TaxFilterOption[]>(() => {
    const options = brands
      .filter((b) => b.active || products.some((p) => p.brandId === b.id))
      .map((b) => ({ value: b.id, label: b.name }))
    if (products.some((p) => !p.brandId)) {
      options.push({ value: 'NONE', label: 'Sin marca asignada' })
    }
    return options
  }, [brands, products])

  const supplierOptions = useMemo<TaxFilterOption[]>(() => {
    const options = suppliers
      .filter((s) => s.active || products.some((p) => p.supplierId === s.id))
      .map((s) => ({ value: s.id, label: s.name }))
    if (products.some((p) => !p.supplierId)) {
      options.push({ value: 'NONE', label: 'Sin proveedor asignado' })
    }
    return options
  }, [suppliers, products])

  const typeOptions = useMemo<TaxFilterOption[]>(() => {
    const options = types
      .filter((t) => t.active || products.some((p) => p.typeId === t.id))
      .map((t) => ({ value: t.id, label: t.name }))
    if (products.some((p) => !p.typeId)) {
      options.push({ value: 'NONE', label: 'Sin tipo asignado' })
    }
    return options
  }, [types, products])

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return products.filter((p) => {
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory
      const matchesTax =
        taxFilter === 'ALL' ? true : taxFilter === 'NONE' ? !p.taxId : p.taxId === taxFilter
      const matchesBrand =
        brandFilter === 'ALL'
          ? true
          : brandFilter === 'NONE'
            ? !p.brandId
            : p.brandId === brandFilter
      const matchesSupplier =
        supplierFilter === 'ALL'
          ? true
          : supplierFilter === 'NONE'
            ? !p.supplierId
            : p.supplierId === supplierFilter
      const matchesType =
        typeFilter === 'ALL'
          ? true
          : typeFilter === 'NONE'
            ? !p.typeId
            : p.typeId === typeFilter
      const matchesStock =
        stockFilter === 'ALL'
          ? true
          : stockFilter === 'LOW'
            ? p.stock > 0 && p.stock <= p.minStock
            : p.stock === 0
      return (
        matchesSearch &&
        matchesCategory &&
        matchesTax &&
        matchesBrand &&
        matchesSupplier &&
        matchesType &&
        matchesStock
      )
    })
  }, [
    products,
    searchTerm,
    selectedCategory,
    stockFilter,
    taxFilter,
    brandFilter,
    supplierFilter,
    typeFilter
  ])

  const stats = useMemo<ProductStats>(
    () => ({
      total: products.length,
      totalStock: products.reduce((acc, p) => acc + p.stock, 0),
      totalValue: products.reduce((acc, p) => acc + p.stock * p.costPrice, 0),
      lowStock: products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length,
      outOfStock: products.filter((p) => p.stock === 0).length
    }),
    [products]
  )

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    stockFilter,
    setStockFilter,
    taxFilter,
    setTaxFilter,
    taxOptions,
    brandFilter,
    setBrandFilter,
    brandOptions,
    supplierFilter,
    setSupplierFilter,
    supplierOptions,
    typeFilter,
    setTypeFilter,
    typeOptions,
    categories,
    filtered,
    stats
  }
}
