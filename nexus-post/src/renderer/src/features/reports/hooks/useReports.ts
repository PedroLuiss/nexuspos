import { useEffect, useState } from 'react'
import type { ReportsData, ReportsQuery } from '@shared/contracts'
import { reportsApi, reportsErrorMessage } from '../api/reports.api'

interface ReportsResultState {
  queryKey: string
  data: ReportsData | null
  error: string | null
}

export function useReports(query: ReportsQuery): {
  data: ReportsData | null
  isLoading: boolean
  error: string | null
} {
  const queryKey = `${query.period}:${query.year}:${query.grouping}`
  const [result, setResult] = useState<ReportsResultState | null>(null)

  useEffect(() => {
    let active = true
    reportsApi
      .getDashboard(query)
      .then((data) => {
        if (active) setResult({ queryKey, data, error: null })
      })
      .catch((reason: unknown) => {
        if (active) setResult({ queryKey, data: null, error: reportsErrorMessage(reason) })
      })
    return () => {
      active = false
    }
  }, [query.period, query.year, query.grouping, queryKey])

  const currentResult = result?.queryKey === queryKey ? result : null
  return {
    data: currentResult?.data ?? null,
    isLoading: currentResult === null,
    error: currentResult?.error ?? null
  }
}
