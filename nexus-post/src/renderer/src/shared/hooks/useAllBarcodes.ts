import { useCallback, useEffect, useRef, useState } from 'react'
import type { ProductBarcode } from '@shared/contracts'

export interface UseAllBarcodesResult {
  /** Mapa de código de barras -> productId (solo códigos activos). */
  barcodeToProduct: Map<string, string>
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
}

function barcodesBridge(): Window['api']['productBarcodes'] {
  if (typeof window === 'undefined' || !window.api?.productBarcodes) {
    throw new Error('El puente IPC no está disponible (preload no cargado)')
  }
  return window.api.productBarcodes
}

/**
 * Carga todos los códigos de barras activos en un mapa para búsqueda rápida en el POS.
 * Permite que al escanear un código secundario (caja, paquete, etc.) se agregue
 * el producto correcto al carrito.
 */
export function useAllBarcodes(): UseAllBarcodesResult {
  const [barcodeToProduct, setBarcodeToProduct] = useState<Map<string, string>>(
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
      const rows = (await barcodesBridge().list({
        onlyActive: true
      })) as ProductBarcode[]
      const map = new Map<string, string>()
      for (const barcode of rows) {
        map.set(barcode.barcode.trim(), barcode.productId)
      }
      if (mounted.current) setBarcodeToProduct(map)
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

  return { barcodeToProduct, isLoading, error, reload }
}
