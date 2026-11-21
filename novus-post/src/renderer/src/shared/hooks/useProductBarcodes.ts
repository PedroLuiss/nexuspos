import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  ProductBarcode,
  ProductBarcodeInput,
  ProductBarcodeFilter
} from '@shared/contracts'

export interface UseProductBarcodesResult {
  barcodes: ProductBarcode[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  createBarcode: (input: ProductBarcodeInput) => Promise<ProductBarcode>
  updateBarcode: (barcode: ProductBarcode) => Promise<ProductBarcode>
  deleteBarcode: (id: string) => Promise<void>
}

function barcodesBridge(): Window['api']['productBarcodes'] {
  if (typeof window === 'undefined' || !window.api?.productBarcodes) {
    throw new Error('El puente IPC no está disponible (preload no cargado)')
  }
  return window.api.productBarcodes
}

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^Error invoking remote method '[^']+':\s*/, '')
  }
  return String(error)
}

/** Códigos de barras de un producto (o todos si no se filtra). */
export function useProductBarcodes(
  productId?: string,
  includeInactive = true
): UseProductBarcodesResult {
  const [barcodes, setBarcodes] = useState<ProductBarcode[]>([])
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
      const filter: ProductBarcodeFilter = { includeDeleted: false }
      if (productId) filter.productId = productId
      if (!includeInactive) filter.onlyActive = true
      const rows = await barcodesBridge().list(filter)
      if (mounted.current) setBarcodes(rows)
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

  const createBarcode = useCallback(async (input: ProductBarcodeInput) => {
    const created = await barcodesBridge().create(input)
    await reload()
    return created
  }, [reload])

  const updateBarcode = useCallback(async (barcode: ProductBarcode) => {
    const updated = await barcodesBridge().update(barcode)
    setBarcodes((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
    return updated
  }, [])

  const deleteBarcode = useCallback(async (id: string) => {
    await barcodesBridge().softDelete(id)
    setBarcodes((prev) => prev.filter((b) => b.id !== id))
  }, [])

  return {
    barcodes,
    isLoading,
    error,
    reload,
    createBarcode,
    updateBarcode,
    deleteBarcode
  }
}
