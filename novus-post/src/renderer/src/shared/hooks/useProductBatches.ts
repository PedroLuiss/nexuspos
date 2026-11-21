import { useCallback, useEffect, useRef, useState } from 'react'
import type { ProductBatch, ProductBatchInput } from '@shared/contracts'
import { daysToExpiry, isBatchExpired } from '@shared/lib/product-batches'

export interface UseProductBatchesResult {
  batches: ProductBatch[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  receive: (input: ProductBatchInput) => Promise<ProductBatch>
  update: (batch: ProductBatch) => Promise<ProductBatch>
  softDelete: (id: string) => Promise<void>
  totalStock: number
}

function batchesBridge(): Window['api']['productBatches'] {
  if (typeof window === 'undefined' || !window.api?.productBatches) {
    throw new Error('El puente IPC no está disponible (preload no cargado)')
  }
  return window.api.productBatches
}

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^Error invoking remote method '[^']+':\s*/, '')
  }
  return String(error)
}

/** Lotes de un producto con utilidades de caducidad calculadas en el cliente. */
export function useProductBatches(productId?: string): UseProductBatchesResult {
  const [batches, setBatches] = useState<ProductBatch[]>([])
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
    if (!productId) {
      setBatches([])
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const rows = await batchesBridge().list({ productId, includeDeleted: false })
      if (mounted.current)
        setBatches(
          [...rows].sort((a, b) => {
            if (a.expirationDate && b.expirationDate)
              return a.expirationDate.localeCompare(b.expirationDate)
            if (a.expirationDate && !b.expirationDate) return -1
            if (!a.expirationDate && b.expirationDate) return 1
            return a.enteredAt.localeCompare(b.enteredAt)
          })
        )
    } catch (err) {
      if (mounted.current) setError(toMessage(err))
    } finally {
      if (mounted.current) setIsLoading(false)
    }
  }, [productId])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void reload()
    }, 0)
    return () => window.clearTimeout(id)
  }, [reload])

  const receive = useCallback(
    async (input: ProductBatchInput) => {
      const created = await batchesBridge().receive(input)
      await reload()
      return created
    },
    [reload]
  )

  const update = useCallback(async (batch: ProductBatch) => {
    const updated = await batchesBridge().update(batch)
    setBatches((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
    return updated
  }, [])

  const softDelete = useCallback(async (id: string) => {
    await batchesBridge().softDelete(id)
    setBatches((prev) => prev.filter((b) => b.id !== id))
  }, [])

  const totalStock = batches.reduce((acc, b) => acc + b.quantity, 0)

  return { batches, isLoading, error, reload, receive, update, softDelete, totalStock }
}

export { daysToExpiry, isBatchExpired }
