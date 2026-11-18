import { useCallback, useEffect, useRef, useState } from 'react'
import type { Product, ProductInput } from '@shared/contracts'

export interface UseProductVariantsResult {
  variants: Product[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  createVariant: (input: ProductInput) => Promise<Product>
  updateVariant: (product: Product) => Promise<Product>
  deleteVariant: (id: string) => Promise<void>
}

function productsBridge(): Window['api']['products'] {
  if (typeof window === 'undefined' || !window.api?.products) {
    throw new Error('El puente IPC no está disponible (preload no cargado)')
  }
  return window.api.products
}

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^Error invoking remote method '[^']+':\s*/, '')
  }
  return String(error)
}

/** Variantes (productos hijo) de un producto padre. */
export function useProductVariants(parentId?: string): UseProductVariantsResult {
  const [variants, setVariants] = useState<Product[]>([])
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
    if (!parentId) {
      setVariants([])
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const rows = await productsBridge().listVariants(parentId)
      if (mounted.current) setVariants(rows)
    } catch (err) {
      if (mounted.current) setError(toMessage(err))
    } finally {
      if (mounted.current) setIsLoading(false)
    }
  }, [parentId])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void reload()
    }, 0)
    return () => window.clearTimeout(id)
  }, [reload])

  const createVariant = useCallback(async (input: ProductInput) => {
    const created = await productsBridge().create(input)
    await reload()
    return created
  }, [reload])

  const updateVariant = useCallback(async (product: Product) => {
    const updated = await productsBridge().update(product)
    setVariants((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
    return updated
  }, [])

  const deleteVariant = useCallback(async (id: string) => {
    await productsBridge().softDelete(id)
    setVariants((prev) => prev.filter((v) => v.id !== id))
  }, [])

  return { variants, isLoading, error, reload, createVariant, updateVariant, deleteVariant }
}
