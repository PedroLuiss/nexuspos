import React, { ReactNode } from 'react'
import { Loader2, Inbox } from 'lucide-react'

export interface Column<T> {
  header: string
  accessor: keyof T | ((row: T) => ReactNode)
  align?: 'left' | 'center' | 'right'
  width?: string
  className?: string
}

export interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  selectedRowKey?: string
  loading?: boolean
  emptyMessage?: string
  emptyIcon?: ReactNode
  className?: string
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  selectedRowKey,
  loading = false,
  emptyMessage = 'No se encontraron registros',
  emptyIcon,
  className = ''
}: DataTableProps<T>) {
  return (
    <div className={`w-full overflow-x-auto bg-white rounded-sm border border-[#D1D1D1] shadow-sm ${className}`}>
      <table className="w-full text-xs text-left border-collapse select-none">
        <thead className="bg-[#F3F3F3] text-[#5C5C5C] font-semibold border-b border-[#D1D1D1] sticky top-0 z-10">
          <tr className="h-[40px]">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-3 h-[40px] font-semibold text-[#5C5C5C] tracking-tight whitespace-nowrap align-middle text-${col.align || 'left'} ${col.className || ''}`}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E5E5]">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-[#717783]">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0067C0]" />
                  <span className="text-xs font-medium text-[#5C5C5C]">Cargando información...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-[#717783]">
                <div className="flex flex-col items-center justify-center gap-2">
                  {emptyIcon || <Inbox className="w-8 h-8 text-[#A0A0A0] stroke-[1.5]" />}
                  <span className="text-xs font-medium text-[#5C5C5C]">{emptyMessage}</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row) => {
              const key = keyExtractor(row)
              const isSelected = selectedRowKey === key
              return (
                <tr
                  key={key}
                  onClick={() => onRowClick?.(row)}
                  className={`h-[40px] transition-colors ${
                    isSelected
                      ? 'bg-[#EBF0F5] text-[#0067C0] font-medium'
                      : 'hover:bg-[#F9F9F9] text-[#1B1B1B]'
                  } ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, idx) => {
                    const content =
                      typeof col.accessor === 'function'
                        ? col.accessor(row)
                        : (row[col.accessor] as ReactNode)

                    return (
                      <td
                        key={idx}
                        className={`px-3 h-[40px] whitespace-nowrap align-middle text-${col.align || 'left'} ${col.className || ''}`}
                      >
                        {content}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
