import { useCallback, useEffect, useRef, useState } from 'react'
import type { Brand, BrandInput, BrandFilter } from '@shared/contracts'

export interface UseBrandsResult {
  brands: Brand[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  createBrand: (input: BrandInput) => Promise<Brand>
  updateBrand: (brand: Brand) => Promise<Brand>
  deleteBrand: (id: string) => Promise<void>
  toggleBrand: (id: string) => Promise<Brand>
}

function brandsBridge(): Window['api']['brands'] {
  if (typeof window === 'undefined' || !window.api?.brands) {
    throw new Error('El puente IPC no está disponible (preload no cargado)')
  }
  return window.api.brands
}

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^Error invoking remote method '[^']+':\s*/, '')
  }
  return String(error)
}

/** Catálogo de marcas compartido por inventario y formularios de producto. */
export function useBrands(includeInactive = true): UseBrandsResult {
  const [brands, setBrands] = useState<Brand[]>([])
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
      const rows = await brandsBridge().list({ includeInactive })
      if (mounted.current) setBrands(rows)
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

  const createBrand = useCallback(async (input: BrandInput) => {
    const created = await brandsBridge().create(input)
    setBrands((prev) => [...prev, created])
    return created
  }, [])

  const updateBrand = useCallback(async (brand: Brand) => {
    const updated = await brandsBridge().update(brand)
    setBrands((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    )
    return updated
  }, [])

  const deleteBrand = useCallback(async (id: string) => {
    await brandsBridge().softDelete(id)
    setBrands((prev) => prev.filter((brand) => brand.id !== id))
  }, [])

  const toggleBrand = useCallback(async (id: string) => {
    const updated = await brandsBridge().toggleStatus(id)
    setBrands((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    )
    return updated
  }, [])

  return {
    brands,
    isLoading,
    error,
    reload,
    createBrand,
    updateBrand,
    deleteBrand,
    toggleBrand
  }
}
