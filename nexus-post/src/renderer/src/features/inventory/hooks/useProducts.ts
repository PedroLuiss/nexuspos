import { useCallback, useEffect, useRef, useState } from 'react'
import type { Product, ProductInput, AdjustStockInput } from '@shared/contracts'
import { productsApi, inventoryApi, toErrorMessage } from '../api/products.api'

export interface UseProductsResult {
  products: Product[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  createProduct: (input: ProductInput) => Promise<Product>
  updateProduct: (product: Product) => Promise<Product>
  deleteProduct: (id: string) => Promise<void>
  toggleStatus: (id: string) => Promise<Product>
  adjustStock: (input: AdjustStockInput) => Promise<Product>
}

/**
 * Carga el catálogo de productos desde SQLite (vía IPC) y expone las mutaciones
 * con actualización optimista local. No conoce detalles de presentación.
 */
export function useProducts(): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const reload = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const rows = await productsApi.list()
      if (mounted.current) setProducts(rows)
    } catch (err) {
      if (mounted.current) setError(toErrorMessage(err))
    } finally {
      if (mounted.current) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void reload()
    }, 0)
    return () => window.clearTimeout(id)
  }, [reload])

  const createProduct = useCallback(async (input: ProductInput) => {
    const created = await productsApi.create(input)
    setProducts((prev) => [created, ...prev])
    return created
  }, [])

  const updateProduct = useCallback(async (product: Product) => {
    const updated = await productsApi.update(product)
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    return updated
  }, [])

  const deleteProduct = useCallback(async (id: string) => {
    await productsApi.softDelete(id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const toggleStatus = useCallback(async (id: string) => {
    const updated = await productsApi.toggleStatus(id)
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
    return updated
  }, [])

  const adjustStock = useCallback(async (input: AdjustStockInput) => {
    const result = await inventoryApi.adjustStock(input)
    setProducts((prev) => prev.map((p) => (p.id === result.product.id ? result.product : p)))
    return result.product
  }, [])

  return {
    products,
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
