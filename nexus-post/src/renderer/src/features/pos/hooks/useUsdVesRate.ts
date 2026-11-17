import { useCallback, useEffect, useRef, useState } from 'react'
import type { UsdVesExchangeRate } from '@shared/contracts'

const REFRESH_INTERVAL_MS = 30 * 60 * 1000

export function useUsdVesRate(enabled: boolean): {
  rate: UsdVesExchangeRate | null
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
} {
  const [rate, setRate] = useState<UsdVesExchangeRate | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    setError(null)
    try {
      if (!window.api) throw new Error('El puente IPC no está disponible (preload no cargado)')
      const current = await window.api.exchangeRate.getUsdVes()
      if (mounted.current) setRate(current)
    } catch (reason: unknown) {
      if (mounted.current) {
        setError(reason instanceof Error ? reason.message : String(reason))
      }
    } finally {
      if (mounted.current) setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    const initialTimer = window.setTimeout(() => void refresh(), 0)
    const intervalId = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS)
    return () => {
      window.clearTimeout(initialTimer)
      window.clearInterval(intervalId)
    }
  }, [enabled, refresh])

  return { rate, isLoading, error, refresh }
}
