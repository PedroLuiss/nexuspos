import { useCallback, useMemo, useState } from 'react'
import type {
  Brand,
  ProductPageQuery,
  ProductStockFilter,
  ProductType,
  Supplier,
  TaxRate
} from '@shared/contracts'
import { useProductFilterOptions, type TaxFilterOption } from './useProductFilterOptions'

export type StockFilter = ProductStockFilter
export type { TaxFilterOption } from './useProductFilterOptions'

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
  page: number
  setPage: (page: number) => void
  pageSize: number
  setPageSize: (pageSize: number) => void
  query: ProductPageQuery
}

export function useProductFilters(
  categories: string[],
  taxes: TaxRate[] = [],
  brands: Brand[] = [],
  suppliers: Supplier[] = [],
  types: ProductType[] = []
): UseProductFiltersResult {
  const [searchTerm, setSearch] = useState('')
  const [selectedCategory, setCategory] = useState('ALL')
  const [stockFilter, setStock] = useState<StockFilter>('ALL')
  const [taxFilter, setTax] = useState('ALL')
  const [brandFilter, setBrand] = useState('ALL')
  const [supplierFilter, setSupplier] = useState('ALL')
  const [typeFilter, setType] = useState('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  const resetPage = useCallback(() => setPage(1), [])
  const setSearchTerm = useCallback(
    (value: string) => {
      setSearch(value)
      resetPage()
    },
    [resetPage]
  )
  const setSelectedCategory = useCallback(
    (value: string) => {
      setCategory(value)
      resetPage()
    },
    [resetPage]
  )
  const setStockFilter = useCallback(
    (value: StockFilter) => {
      setStock(value)
      resetPage()
    },
    [resetPage]
  )
  const setTaxFilter = useCallback(
    (value: string) => {
      setTax(value)
      resetPage()
    },
    [resetPage]
  )
  const setBrandFilter = useCallback(
    (value: string) => {
      setBrand(value)
      resetPage()
    },
    [resetPage]
  )
  const setSupplierFilter = useCallback(
    (value: string) => {
      setSupplier(value)
      resetPage()
    },
    [resetPage]
  )
  const setTypeFilter = useCallback(
    (value: string) => {
      setType(value)
      resetPage()
    },
    [resetPage]
  )
  const updatePageSize = useCallback(
    (value: number) => {
      setPageSize(Math.min(100, Math.max(25, value)))
      resetPage()
    },
    [resetPage]
  )

  const { taxOptions, brandOptions, supplierOptions, typeOptions } = useProductFilterOptions(
    taxes,
    brands,
    suppliers,
    types
  )

  const query = useMemo<ProductPageQuery>(
    () => ({
      page,
      pageSize,
      search: searchTerm.trim() || undefined,
      category: selectedCategory === 'ALL' ? undefined : selectedCategory,
      stockFilter,
      taxId: taxFilter !== 'ALL' && taxFilter !== 'NONE' ? taxFilter : undefined,
      taxUnassigned: taxFilter === 'NONE',
      brandId: brandFilter !== 'ALL' && brandFilter !== 'NONE' ? brandFilter : undefined,
      brandUnassigned: brandFilter === 'NONE',
      supplierId:
        supplierFilter !== 'ALL' && supplierFilter !== 'NONE' ? supplierFilter : undefined,
      supplierUnassigned: supplierFilter === 'NONE',
      typeId: typeFilter !== 'ALL' && typeFilter !== 'NONE' ? typeFilter : undefined,
      typeUnassigned: typeFilter === 'NONE'
    }),
    [
      page,
      pageSize,
      searchTerm,
      selectedCategory,
      stockFilter,
      taxFilter,
      brandFilter,
      supplierFilter,
      typeFilter
    ]
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
    categories: ['ALL', ...Array.from(new Set(categories))],
    page,
    setPage,
    pageSize,
    setPageSize: updatePageSize,
    query
  }
}
