import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  ProductType,
  ProductTypeInput,
  ProductTypeFilter
} from '@shared/contracts'

export interface UseProductTypesResult {
  types: ProductType[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  createProductType: (input: ProductTypeInput) => Promise<ProductType>
  updateProductType: (type: ProductType) => Promise<ProductType>
  deleteProductType: (id: string) => Promise<void>
  toggleProductType: (id: string) => Promise<ProductType>
}

function productTypesBridge(): Window['api']['productTypes'] {
  if (typeof window === 'undefined' || !window.api?.productTypes) {
    throw new Error('El puente IPC no está disponible (preload no cargado)')
  }
  return window.api.productTypes
}

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^Error invoking remote method '[^']+':\s*/, '')
  }
  return String(error)
}

/** Catálogo de tipos de producto compartido por inventario y formularios de producto. */
export function useProductTypes(includeInactive = true): UseProductTypesResult {
  const [types, setTypes] = useState<ProductType[]>([])
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
      const rows = await productTypesBridge().list({ includeInactive })
      if (mounted.current) setTypes(rows)
    } catch (err) {
      if (mounted.current) setError(toMessage(err))
    } finally {
      if (mounted.current) setIsLoading(false)
    }
  }, [includeInactive])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void reload()
    }, 0)
    return () => window.clearTimeout(id)
  }, [reload])

  const createProductType = useCallback(async (input: ProductTypeInput) => {
    const created = await productTypesBridge().create(input)
    setTypes((prev) => [...prev, created])
    return created
  }, [])

  const updateProductType = useCallback(async (type: ProductType) => {
    const updated = await productTypesBridge().update(type)
    setTypes((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    )
    return updated
  }, [])

  const deleteProductType = useCallback(async (id: string) => {
    await productTypesBridge().softDelete(id)
    setTypes((prev) => prev.filter((type) => type.id !== id))
  }, [])

  const toggleProductType = useCallback(async (id: string) => {
    const updated = await productTypesBridge().toggleStatus(id)
    setTypes((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    )
    return updated
  }, [])

  return {
    types,
    isLoading,
    error,
    reload,
    createProductType,
    updateProductType,
    deleteProductType,
    toggleProductType
  }
}
