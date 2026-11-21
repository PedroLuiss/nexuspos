import React, { ReactNode } from 'react'

export interface Column<T> {
  header: string
  accessor: keyof T | ((row: T) => ReactNode)
  align?: 'left' | 'center' | 'right'
  width?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T) => string
  onRowClick?: (row: T) => void
  emptyMessage?: string
}

export function DataTable<T>({ 
  data, 
  columns, 
  keyExtractor, 
  onRowClick,
  emptyMessage = 'No hay registros'
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto bg-white rounded-sm border border-gray-200 shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-[#F3F3F3] text-gray-700 border-b border-gray-200">
          <tr>
            {columns.map((col, idx) => (
              <th 
                key={idx} 
                className={`px-4 h-10 font-medium whitespace-nowrap text-${col.align || 'left'}`}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr 
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={`h-10 transition-colors hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map((col, idx) => {
                  const content = typeof col.accessor === 'function' 
                    ? col.accessor(row) 
                    : row[col.accessor] as ReactNode
                    
                  return (
                    <td 
                      key={idx} 
                      className={`px-4 whitespace-nowrap text-${col.align || 'left'}`}
                    >
                      {content}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
