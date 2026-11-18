import React from 'react'

interface TablePaginationProps {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  showSinglePage?: boolean
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
  showSinglePage = false
}) => {
  if (!showSinglePage && totalPages <= 1) return null

  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const lastItem = Math.min(page * pageSize, totalItems)
  const buttonClass =
    'px-2 py-1 text-[10px] font-semibold border border-slate-300 rounded-[4px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50'

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-600">
      <span>
        Mostrando {firstItem}-{lastItem} de {totalItems}
      </span>
      <div className="flex items-center gap-1.5">
        {onPageSizeChange && (
          <label className="flex items-center gap-1">
            Filas
            <select
              aria-label="Filas por página"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="px-1.5 py-1 bg-white border border-slate-300 rounded-[4px]"
            >
              {[25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="button"
          className={buttonClass}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>
        <span className="min-w-[48px] text-center">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className={buttonClass}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}

export default TablePagination
