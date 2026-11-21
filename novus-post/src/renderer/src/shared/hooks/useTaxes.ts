import { useCallback, useEffect, useRef, useState } from 'react'
import type { TaxInput, TaxRate } from '@shared/contracts'

export interface UseTaxesResult {
  taxes: TaxRate[]
  /** Tasa que se aplica a productos nuevos (cae a la primera activa). */
  defaultTax: TaxRate | null
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  createTax: (input: TaxInput) => Promise<TaxRate>
  updateTax: (tax: TaxRate) => Promise<TaxRate>
  deleteTax: (id: string) => Promise<void>
  setDefaultTax: (id: string) => Promise<TaxRate>
}

function taxesBridge(): Window['api']['taxes'] {
  if (typeof window === 'undefined' || !window.api?.taxes) {
    throw new Error('El puente IPC no está disponible (preload no cargado)')
  }
  return window.api.taxes
}

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^Error invoking remote method '[^']+':\s*/, '')
  }
  return String(error)
}

/**
 * Catálogo de impuestos compartido por inventario, POS y ajustes.
 * Es transversal, por eso vive en `shared/hooks` y no en una feature.
 */
export function useTaxes(includeInactive = true): UseTaxesResult {
  const [taxes, setTaxes] = useState<TaxRate[]>([])
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
      const rows = await taxesBridge().list(includeInactive)
      if (mounted.current) setTaxes(rows)
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

  const createTax = useCallback(async (input: TaxInput) => {
    const created = await taxesBridge().create(input)
    setTaxes((prev) => [
      ...prev.map((tax) => (created.isDefault ? { ...tax, isDefault: false } : tax)),
      created
    ])
    return created
  }, [])

  const updateTax = useCallback(async (tax: TaxRate) => {
    const updated = await taxesBridge().update(tax)
    setTaxes((prev) =>
      prev.map((item) =>
        item.id === updated.id ? updated : updated.isDefault ? { ...item, isDefault: false } : item
      )
    )
    return updated
  }, [])

  const deleteTax = useCallback(async (id: string) => {
    await taxesBridge().remove(id)
    setTaxes((prev) => prev.filter((tax) => tax.id !== id))
  }, [])

  const setDefaultTax = useCallback(async (id: string) => {
    const updated = await taxesBridge().setDefault(id)
    setTaxes((prev) =>
      prev.map((tax) => ({
        ...tax,
        isDefault: tax.id === updated.id
      }))
    )
    return updated
  }, [])

  const defaultTax =
    taxes.find((tax) => tax.isDefault && tax.active) ?? taxes.find((tax) => tax.active) ?? null

  return {
    taxes,
    defaultTax,
    isLoading,
    error,
    reload,
    createTax,
    updateTax,
    deleteTax,
    setDefaultTax
  }
}
