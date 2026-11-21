import { useCallback, useEffect, useRef, useState } from 'react'
import type { Product, ProductInput, AdjustStockInput, ProductPageQuery } from '@shared/contracts'
import { productsApi, inventoryApi, toErrorMessage } from '../api/products.api'

export interface UseProductsResult {
  products: Product[]
  page: number
  total: number
  totalPages: number
  stats: {
    total: number
    totalStock: number
    totalValue: number
    lowStock: number
    outOfStock: number
  }
  isLoading: boolean
  error: string | null
  reload: (refreshStats?: boolean) => Promise<void>
  createProduct: (input: ProductInput) => Promise<Product>
  updateProduct: (product: Product) => Promise<Product>
  deleteProduct: (id: string) => Promise<void>
  toggleStatus: (id: string) => Promise<Product>
  adjustStock: (input: AdjustStockInput) => Promise<Product>
}

const EMPTY_STATS = { total: 0, totalStock: 0, totalValue: 0, lowStock: 0, outOfStock: 0 }

/** Carga solo la página solicitada; los filtros se aplican en SQLite. */
export function useProducts(query?: ProductPageQuery, enabled = true): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(query?.page ?? 1)
  const [totalPages, setTotalPages] = useState(1)
  const [stats, setStats] = useState(EMPTY_STATS)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)
  const statsLoaded = useRef(false)
  const queryKey = query ? JSON.stringify(query) : 'all'
  const latestQueryKey = useRef(queryKey)

  useEffect(() => {
    latestQueryKey.current = queryKey
  }, [queryKey])
  useEffect(
    () => () => {
      requestId.current += 1
    },
    []
  )

  const reload = useCallback(
    async (refreshStats = false) => {
      if (!enabled) return
      if (refreshStats) statsLoaded.current = false
      const request = ++requestId.current
      setIsLoading(true)
      setError(null)
      try {
        const result = query
          ? await productsApi.listPage({ ...query, includeStats: !statsLoaded.current })
          : await productsApi.list()
        if (request !== requestId.current || queryKey !== latestQueryKey.current) return
        if (Array.isArray(result)) {
          setProducts(result)
          setPage(1)
          setTotal(result.length)
          setTotalPages(1)
          setStats({
            total: result.length,
            totalStock: result.reduce((sum, product) => sum + product.stock, 0),
            totalValue: result.reduce((sum, product) => sum + product.stock * product.costPrice, 0),
            lowStock: result.filter(
              (product) => product.stock > 0 && product.stock <= product.minStock
            ).length,
            outOfStock: result.filter((product) => product.stock === 0).length
          })
          statsLoaded.current = true
        } else {
          setProducts(result.items)
          setPage(result.page)
          setTotal(result.total)
          setTotalPages(result.totalPages)
          if (result.stats) {
            setStats(result.stats)
            statsLoaded.current = true
          }
        }
      } catch (err) {
        if (request === requestId.current && queryKey === latestQueryKey.current) {
          setError(toErrorMessage(err))
        }
      } finally {
        if (request === requestId.current && queryKey === latestQueryKey.current) {
          setIsLoading(false)
        }
      }
    },
    [enabled, query, queryKey]
  )

  useEffect(() => {
    if (!enabled) return
    const delay = query?.search ? 250 : 0
    const timer = window.setTimeout(() => void reload(), delay)
    return () => window.clearTimeout(timer)
  }, [enabled, query?.search, reload])

  const createProduct = useCallback(
    async (input: ProductInput) => {
      const created = await productsApi.create(input)
      statsLoaded.current = false
      await reload()
      return created
    },
    [reload]
  )

  const updateProduct = useCallback(
    async (product: Product) => {
      const updated = await productsApi.update(product)
      statsLoaded.current = false
      await reload()
      return updated
    },
    [reload]
  )

  const deleteProduct = useCallback(
    async (id: string) => {
      const statsDelta = await productsApi.softDelete(id)
      if (statsLoaded.current) {
        setStats((current) => ({
          total: Math.max(0, current.total + statsDelta.total),
          totalStock: current.totalStock + statsDelta.totalStock,
          totalValue: current.totalValue + statsDelta.totalValue,
          lowStock: Math.max(0, current.lowStock + statsDelta.lowStock),
          outOfStock: Math.max(0, current.outOfStock + statsDelta.outOfStock)
        }))
      }
      await reload()
    },
    [reload]
  )

  const toggleStatus = useCallback(
    async (id: string) => {
      const updated = await productsApi.toggleStatus(id)
      statsLoaded.current = false
      await reload()
      return updated
    },
    [reload]
  )

  const adjustStock = useCallback(
    async (input: AdjustStockInput) => {
      const result = await inventoryApi.adjustStock(input)
      statsLoaded.current = false
      await reload()
      return result.product
    },
    [reload]
  )

  return {
    products,
    page,
    total,
    totalPages,
    stats,
    isLoading,
    error,
    reload,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleStatus,
    adjustStock
  }
}
