import { useCallback, useEffect, useRef, useState } from 'react'
import type { KardexExportFormat, KardexMovementPage, KardexMovementQuery } from '@shared/contracts'
import { getKardexPeriodRange } from '@shared/lib/kardex-period'
import { kardexApi, kardexErrorMessage } from '../api/kardex.api'

const EMPTY_PAGE: KardexMovementPage = {
  items: [],
  page: 1,
  pageSize: 50,
  total: 0,
  totalPages: 1,
  summary: {
    total: 0,
    distinctProducts: 0,
    entryMovements: 0,
    exitMovements: 0,
    entriesByUnit: [],
    exitsByUnit: []
  }
}

function createInitialQuery(): KardexMovementQuery {
  return {
    period: 'MONTH',
    ...getKardexPeriodRange('MONTH'),
    search: '',
    type: 'ALL',
    reason: 'ALL',
    page: 1,
    pageSize: 50
  }
}

export function useKardex(enabled = true): {
  data: KardexMovementPage
  query: KardexMovementQuery
  setQuery: React.Dispatch<React.SetStateAction<KardexMovementQuery>>
  isLoading: boolean
  error: string | null
  reload: () => Promise<boolean>
  exportMovements: (format: KardexExportFormat) => Promise<boolean>
} {
  const [data, setData] = useState<KardexMovementPage>(EMPTY_PAGE)
  const [query, setQuery] = useState<KardexMovementQuery>(createInitialQuery)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)
  const requestId = useRef(0)
  const isLoading = enabled && (!hasLoaded || isRefreshing)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const reload = useCallback(async (): Promise<boolean> => {
    const currentRequestId = ++requestId.current
    setIsRefreshing(true)
    setError(null)
    try {
      const requestQuery = {
        ...query,
        ...getKardexPeriodRange(query.period)
      }
      const result = await kardexApi.listMovements(requestQuery)
      if (mounted.current && currentRequestId === requestId.current) setData(result)
      return true
    } catch (err: unknown) {
      if (mounted.current && currentRequestId === requestId.current) {
        setError(kardexErrorMessage(err))
      }
      return false
    } finally {
      if (mounted.current && currentRequestId === requestId.current) {
        setHasLoaded(true)
        setIsRefreshing(false)
      }
    }
  }, [query])

  const exportMovements = useCallback(
    (format: KardexExportFormat): Promise<boolean> =>
      kardexApi.exportMovements(
        {
          ...query,
          ...getKardexPeriodRange(query.period),
          page: 1,
          pageSize: 100
        },
        format
      ),
    [query]
  )

  useEffect(() => {
    if (!enabled) return
    const timer = window.setTimeout(() => void reload(), 0)
    return () => {
      window.clearTimeout(timer)
      requestId.current += 1
    }
  }, [enabled, reload])

  return { data, query, setQuery, isLoading, error, reload, exportMovements }
}
