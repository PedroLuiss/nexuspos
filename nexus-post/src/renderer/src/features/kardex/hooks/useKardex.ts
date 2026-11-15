import { useCallback, useEffect, useRef, useState } from 'react'
import type { KardexMovement } from '@shared/contracts'
import { kardexApi, kardexErrorMessage } from '../api/kardex.api'

export function useKardex(enabled = true): {
  movements: KardexMovement[]
  isLoading: boolean
  error: string | null
  reload: () => Promise<boolean>
} {
  const [movements, setMovements] = useState<KardexMovement[]>([])
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)
  const isLoading = enabled && (!hasLoaded || isRefreshing)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const reload = useCallback(async (): Promise<boolean> => {
    setIsRefreshing(true)
    setError(null)
    try {
      const data = await kardexApi.listMovements()
      if (mounted.current) setMovements(data)
      return true
    } catch (err: unknown) {
      if (mounted.current) setError(kardexErrorMessage(err))
      return false
    } finally {
      if (mounted.current) {
        setHasLoaded(true)
        setIsRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false

    const load = async (): Promise<void> => {
      try {
        const data = await kardexApi.listMovements()
        if (!cancelled && mounted.current) {
          setMovements(data)
          setError(null)
        }
      } catch (err: unknown) {
        if (!cancelled && mounted.current) setError(kardexErrorMessage(err))
      } finally {
        if (!cancelled && mounted.current) setHasLoaded(true)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [enabled])

  return { movements, isLoading, error, reload }
}
