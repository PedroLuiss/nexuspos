import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  ProductPriceTier,
  ProductPriceTierInput,
  ProductPriceTierFilter
} from '@shared/contracts'

export interface UseProductPriceTiersResult {
  tiers: ProductPriceTier[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  createTier: (input: ProductPriceTierInput) => Promise<ProductPriceTier>
  updateTier: (tier: ProductPriceTier) => Promise<ProductPriceTier>
  deleteTier: (id: string) => Promise<void>
  /** Resuelve el precio aplicable para una cantidad dada (en el cliente). */
  resolvePrice: (quantity: number) => ProductPriceTier | null
}

function tiersBridge(): Window['api']['productPriceTiers'] {
  if (typeof window === 'undefined' || !window.api?.productPriceTiers) {
    throw new Error('El puente IPC no está disponible (preload no cargado)')
  }
  return window.api.productPriceTiers
}

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^Error invoking remote method '[^']+':\s*/, '')
  }
  return String(error)
}

/** Precios por mayoreo (tiers) de un producto (o todos si no se filtra). */
export function useProductPriceTiers(
  productId?: string,
  includeInactive = true
): UseProductPriceTiersResult {
  const [tiers, setTiers] = useState<ProductPriceTier[]>([])
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
      const filter: ProductPriceTierFilter = { includeDeleted: false }
      if (productId) filter.productId = productId
      if (!includeInactive) filter.onlyActive = true
      const rows = await tiersBridge().list(filter)
      if (mounted.current) setTiers(rows)
    } catch (err) {
      if (mounted.current) setError(toMessage(err))
    } finally {
      if (mounted.current) setIsLoading(false)
    }
  }, [productId, includeInactive])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void reload()
    }, 0)
    return () => window.clearTimeout(id)
  }, [reload])

  const createTier = useCallback(async (input: ProductPriceTierInput) => {
    const created = await tiersBridge().create(input)
    await reload()
    return created
  }, [reload])

  const updateTier = useCallback(async (tier: ProductPriceTier) => {
    const updated = await tiersBridge().update(tier)
    setTiers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    return updated
  }, [])

  const deleteTier = useCallback(async (id: string) => {
    await tiersBridge().softDelete(id)
    setTiers((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const resolvePrice = useCallback(
    (quantity: number): ProductPriceTier | null => {
      const applicable = tiers
        .filter(
          (t) =>
            !t.deleted &&
            t.active &&
            t.minQuantity <= quantity &&
            (t.maxQuantity === undefined || t.maxQuantity === null || quantity <= t.maxQuantity)
        )
        .sort((a, b) => b.minQuantity - a.minQuantity)
      return applicable[0] ?? null
    },
    [tiers]
  )

  return {
    tiers,
    isLoading,
    error,
    reload,
    createTier,
    updateTier,
    deleteTier,
    resolvePrice
  }
}
