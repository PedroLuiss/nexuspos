import { useCallback, useEffect, useRef, useState } from 'react'
import type { ProductPriceTier } from '@shared/contracts'

export interface UseAllPriceTiersResult {
  /** Mapa de productId -> tiers activos. */
  tiersByProduct: Map<string, ProductPriceTier[]>
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
}

function tiersBridge(): Window['api']['productPriceTiers'] {
  if (typeof window === 'undefined' || !window.api?.productPriceTiers) {
    throw new Error('El puente IPC no está disponible (preload no cargado)')
  }
  return window.api.productPriceTiers
}

/**
 * Carga todas las escalas de precios por mayoreo activas y las agrupa por producto.
 * Se usa en el POS (y modales de cobro) para que el preview coincida con lo que
 * el backend calculará al cobrar.
 */
export function useAllPriceTiers(): UseAllPriceTiersResult {
  const [tiersByProduct, setTiersByProduct] = useState<Map<string, ProductPriceTier[]>>(
    () => new Map()
  )
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
      const rows = await tiersBridge().list({ onlyActive: true })
      const map = new Map<string, ProductPriceTier[]>()
      for (const tier of rows) {
        const list = map.get(tier.productId) ?? []
        list.push(tier)
        map.set(tier.productId, list)
      }
      if (mounted.current) setTiersByProduct(map)
    } catch (err) {
      if (mounted.current) {
        setError(err instanceof Error ? err.message : String(err))
      }
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

  return { tiersByProduct, isLoading, error, reload }
}
