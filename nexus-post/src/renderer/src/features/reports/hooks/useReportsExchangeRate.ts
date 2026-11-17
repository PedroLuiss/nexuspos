import { useEffect, useState } from 'react'
import type { UsdVesExchangeRate } from '@shared/contracts'
import { reportsErrorMessage } from '../api/reports.api'

const REFRESH_INTERVAL_MS = 30 * 60 * 1000

interface ExchangeRateState {
  rate: UsdVesExchangeRate | null
  error: string | null
}

export function useReportsExchangeRate(): ExchangeRateState {
  const [state, setState] = useState<ExchangeRateState>({ rate: null, error: null })

  useEffect(() => {
    let active = true
    const refresh = (): void => {
      window.api.exchangeRate
        .getUsdVes()
        .then((rate) => {
          if (active) setState({ rate, error: null })
        })
        .catch((error: unknown) => {
          if (active)
            setState((current) => ({ rate: current.rate, error: reportsErrorMessage(error) }))
        })
    }
    const initialTimer = window.setTimeout(refresh, 0)
    const intervalId = window.setInterval(refresh, REFRESH_INTERVAL_MS)
    return () => {
      active = false
      window.clearTimeout(initialTimer)
      window.clearInterval(intervalId)
    }
  }, [])

  return state
}
