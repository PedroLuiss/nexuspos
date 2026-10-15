import { useMemo, useState } from 'react'
import type { Product } from '@shared/contracts'

export type StockFilter = 'ALL' | 'LOW' | 'OUT'

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
  categories: string[]
  filtered: Product[]
  stats: ProductStats
}

/** Filtrado y métricas del catálogo, calculados en memoria. */
export function useProductFilters(products: Product[]): UseProductFiltersResult {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [stockFilter, setStockFilter] = useState<StockFilter>('ALL')

  const categories = useMemo(
    () => ['ALL', ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  )

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return products.filter((p) => {
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory
      const matchesStock =
        stockFilter === 'ALL'
          ? true
          : stockFilter === 'LOW'
            ? p.stock > 0 && p.stock <= p.minStock
            : p.stock === 0
      return matchesSearch && matchesCategory && matchesStock
    })
  }, [products, searchTerm, selectedCategory, stockFilter])

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
    categories,
    filtered,
    stats
  }
}
