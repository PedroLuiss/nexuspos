import { useCallback, useEffect, useRef, useState } from 'react'
import type { Product, ProductPageResult } from '@shared/contracts'
import { posProductsApi, posProductsErrorMessage } from '../api/products.api'

const PAGE_SIZE = 50

interface UsePosProductSearchResult {
  products: Product[]
  total: number
  hasMore: boolean
  isLoading: boolean
  isLoadingMore: boolean
  error: string | null
  loadMore: () => void
  searchNow: (query: string) => Promise<Product[]>
  refresh: () => void
}

export function usePosProductSearch(
  searchInput: string,
  enabled: boolean
): UsePosProductSearchResult {
  const [products, setProducts] = useState<Product[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [resolvedQuery, setResolvedQuery] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestId = useRef(0)
  const query = searchInput.trim()

  const loadPage = useCallback(
    async (search: string, pageNumber: number, append: boolean): Promise<Product[]> => {
      const request = ++requestId.current
      setError(null)
      if (append) setIsLoadingMore(true)
      else setIsLoading(true)

      try {
        const result: ProductPageResult = await posProductsApi.listPage({
          page: pageNumber,
          pageSize: PAGE_SIZE,
          search: search || undefined,
          onlyActive: true,
          includeStats: false
        })

        if (request !== requestId.current) return []
        setProducts((current) => (append ? [...current, ...result.items] : result.items))
        setPage(result.page)
        setTotal(result.total)
        setTotalPages(result.totalPages)
        setResolvedQuery(search)
        return result.items
      } catch (requestError) {
        if (request === requestId.current) setError(posProductsErrorMessage(requestError))
        return []
      } finally {
        if (request === requestId.current) {
          setIsLoading(false)
          setIsLoadingMore(false)
        }
      }
    },
    []
  )

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        if (!enabled) {
          requestId.current += 1
          setProducts([])
          setPage(1)
          setTotal(0)
          setTotalPages(1)
          setResolvedQuery(null)
          setIsLoading(false)
          setIsLoadingMore(false)
          setError(null)
          return
        }

        setProducts([])
        setPage(1)
        setTotal(0)
        setTotalPages(1)
        setIsLoading(true)
        setError(null)
        void loadPage(query, 1, false)
      },
      enabled && query ? 250 : 0
    )

    return () => {
      window.clearTimeout(timer)
      requestId.current += 1
    }
  }, [enabled, loadPage, query])

  const isCurrentQuery = resolvedQuery === query
  const loadMore = useCallback(() => {
    if (enabled && !isLoading && !isLoadingMore && page < totalPages) {
      void loadPage(query, page + 1, true)
    }
  }, [enabled, isLoading, isLoadingMore, loadPage, page, query, totalPages])

  const searchNow = useCallback(
    (value: string): Promise<Product[]> => loadPage(value.trim(), 1, false),
    [loadPage]
  )

  const refresh = useCallback(() => {
    if (enabled) void loadPage(query, 1, false)
  }, [enabled, loadPage, query])

  return {
    products: isCurrentQuery ? products : [],
    total: isCurrentQuery ? total : 0,
    hasMore: isCurrentQuery && page < totalPages,
    isLoading: isLoading || (enabled && !isCurrentQuery),
    isLoadingMore,
    error,
    loadMore,
    searchNow,
    refresh
  }
}
