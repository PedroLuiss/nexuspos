import { useCallback, useEffect, useRef, useState } from 'react'
import type { ComboItem, ComboItemInput } from '@shared/contracts'

export interface UseComboItemsResult {
  items: ComboItem[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<void>
  createItem: (input: ComboItemInput) => Promise<ComboItem>
  updateItem: (item: ComboItem) => Promise<ComboItem>
  deleteItem: (id: string) => Promise<void>
}

function combosBridge(): Window['api']['comboItems'] {
  if (typeof window === 'undefined' || !window.api?.comboItems) {
    throw new Error('El puente IPC no está disponible (preload no cargado)')
  }
  return window.api.comboItems
}

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message.replace(/^Error invoking remote method '[^']+':\s*/, '')
  }
  return String(error)
}

/** Componentes de un producto combo (bundle). */
export function useComboItems(comboId?: string): UseComboItemsResult {
  const [items, setItems] = useState<ComboItem[]>([])
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
      const rows = await combosBridge().list({ comboId, includeDeleted: false })
      if (mounted.current) setItems(rows)
    } catch (err) {
      if (mounted.current) setError(toMessage(err))
    } finally {
      if (mounted.current) setIsLoading(false)
    }
  }, [comboId])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void reload()
    }, 0)
    return () => window.clearTimeout(id)
  }, [reload])

  const createItem = useCallback(async (input: ComboItemInput) => {
    const created = await combosBridge().create(input)
    await reload()
    return created
  }, [reload])

  const updateItem = useCallback(async (item: ComboItem) => {
    const updated = await combosBridge().update(item)
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))
    return updated
  }, [])

  const deleteItem = useCallback(async (id: string) => {
    await combosBridge().softDelete(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  return { items, isLoading, error, reload, createItem, updateItem, deleteItem }
}
