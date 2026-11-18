import { useMemo, useState } from 'react'

export interface TablePaginationResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  setPage: (page: number) => void
}

export function useTablePagination<T>(items: T[], pageSize = 10): TablePaginationResult<T> {
  const [requestedPage, setRequestedPage] = useState(1)
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const page = Math.min(requestedPage, totalPages)
  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  )

  return {
    items: pageItems,
    page,
    pageSize,
    totalItems,
    totalPages,
    setPage: (nextPage) => setRequestedPage(Math.max(1, Math.min(nextPage, totalPages)))
  }
}
