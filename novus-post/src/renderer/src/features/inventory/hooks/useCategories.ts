import { useCallback, useEffect, useRef, useState } from 'react'
import type { Category, CategoryInput } from '@shared/contracts'
import { categoriesApi } from '../api/categories.api'
import { toErrorMessage } from '../api/products.api'

export interface UseCategoriesResult {
  categories: Category[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  createCategory: (input: CategoryInput) => Promise<Category>
  updateCategory: (category: Category) => Promise<Category>
  deleteCategory: (id: string) => Promise<void>
  toggleStatus: (id: string) => Promise<Category>
  /** Nombres activos (no borrados) — útil para poblar selects de productos. */
  activeNames: string[]
}

/**
 * Carga el catálogo de categorías desde SQLite (vía IPC) y expone las mutaciones
 * con actualización optimista local. No conoce detalles de presentación.
 */
export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([])
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
      const rows = await categoriesApi.list()
      if (mounted.current) setCategories(rows)
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

  const createCategory = useCallback(async (input: CategoryInput) => {
    const created = await categoriesApi.create(input)
    setCategories((prev) => [created, ...prev])
    return created
  }, [])

  const updateCategory = useCallback(async (category: Category) => {
    const updated = await categoriesApi.update(category)
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    return updated
  }, [])

  const deleteCategory = useCallback(async (id: string) => {
    await categoriesApi.softDelete(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const toggleStatus = useCallback(async (id: string) => {
    const updated = await categoriesApi.toggleStatus(id)
    setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    return updated
  }, [])

  const activeNames = categories.filter((c) => c.active && !c.deleted).map((c) => c.name)

  return {
    categories,
    isLoading,
    error,
    reload,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleStatus,
    activeNames
  }
}
