import { useCallback, useEffect, useRef, useState } from 'react'
import type { Supplier, SupplierInput, SupplierFilter } from '@shared/contracts'

export interface UseSuppliersResult {
  suppliers: Supplier[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  createSupplier: (input: SupplierInput) => Promise<Supplier>
  updateSupplier: (supplier: Supplier) => Promise<Supplier>
  deleteSupplier: (id: string) => Promise<void>
  toggleSupplier: (id: string) => Promise<Supplier>
}

function suppliersBridge(): Window['api']['suppliers'] {
  if (typeof window === 'undefined' || !window.api?.suppliers) {
    throw new Error('El puente IPC no está disponible (preload no cargado)')
  }
  return window.api.suppliers
}

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^Error invoking remote method '[^']+':\s*/, '')
  }
  return String(error)
}

/** Catálogo de proveedores compartido por inventario y formularios de producto. */
export function useSuppliers(includeInactive = true): UseSuppliersResult {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
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
      const rows = await suppliersBridge().list({ includeInactive })
      if (mounted.current) setSuppliers(rows)
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

  const createSupplier = useCallback(async (input: SupplierInput) => {
    const created = await suppliersBridge().create(input)
    setSuppliers((prev) => [...prev, created])
    return created
  }, [])

  const updateSupplier = useCallback(async (supplier: Supplier) => {
    const updated = await suppliersBridge().update(supplier)
    setSuppliers((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    )
    return updated
  }, [])

  const deleteSupplier = useCallback(async (id: string) => {
    await suppliersBridge().softDelete(id)
    setSuppliers((prev) => prev.filter((supplier) => supplier.id !== id))
  }, [])

  const toggleSupplier = useCallback(async (id: string) => {
    const updated = await suppliersBridge().toggleStatus(id)
    setSuppliers((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    )
    return updated
  }, [])

  return {
    suppliers,
    isLoading,
    error,
    reload,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    toggleSupplier
  }
}
