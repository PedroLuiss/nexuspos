import React from 'react'
import type { Category } from '@shared/contracts'
import { Pencil, Trash2, ToggleLeft, ToggleRight } from '../../../shared/icons/Icons'
import { useTablePagination } from '../hooks/useTablePagination'
import TablePagination from './TablePagination'

interface CategoryTableProps {
  categories: Category[]
  isLoading?: boolean
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  onToggleStatus: (id: string) => void
}

/** Tabla densa de categorías (estado, acciones). Estilo Fluent WinUI 3. */
export const CategoryTable: React.FC<CategoryTableProps> = ({
  categories,
  isLoading = false,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const pagination = useTablePagination(categories)

  if (isLoading) {
    return (
      <div className="border border-[#E5E5E5] rounded-[4px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-xs">
            <thead>
              <tr className="bg-[#F9F9F9] border-b border-[#E5E5E5] text-[#5C5C5C]">
                <th className="text-left px-3 py-2 font-semibold">Nombre</th>
                <th className="text-left px-3 py-2 font-semibold">Descripción</th>
                <th className="text-center px-3 py-2 font-semibold w-24">Estado</th>
                <th className="text-right px-3 py-2 font-semibold w-32">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F0F0]">
              {Array.from({ length: 4 }, (_, i) => (
                <tr key={i} className="animate-pulse" style={{ height: '36px' }}>
                  <td className="px-3 py-2">
                    <div className="h-3 w-28 bg-slate-200 rounded-[3px]" />
                  </td>
                  <td className="px-3 py-2">
                    <div
                      className="h-3 bg-slate-100 rounded-[3px]"
                      style={{ width: `${40 + i * 15}%` }}
                    />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="h-4 w-14 bg-slate-200 rounded-full mx-auto" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <div className="w-6 h-6 bg-slate-200 rounded-[3px]" />
                      <div className="w-6 h-6 bg-slate-200 rounded-[3px]" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-[#717783]">
        No hay categorías registradas. Crea la primera con el formulario superior.
      </div>
    )
  }

  return (
    <div className="border border-[#E5E5E5] rounded-[4px] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] text-xs">
          <thead>
            <tr className="bg-[#F9F9F9] border-b border-[#E5E5E5] text-[#5C5C5C]">
              <th className="text-left px-3 py-2 font-semibold">Nombre</th>
              <th className="text-left px-3 py-2 font-semibold">Descripción</th>
              <th className="text-center px-3 py-2 font-semibold w-24">Estado</th>
              <th className="text-right px-3 py-2 font-semibold w-32">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagination.items.map((cat) => (
              <tr
                key={cat.id}
                className="border-b border-[#F0F0F0] last:border-b-0 hover:bg-[#F9F9F9] transition-colors"
              >
                <td className="px-3 py-2 font-semibold text-[#1B1B1B]">{cat.name}</td>
                <td className="px-3 py-2 text-[#5C5C5C] max-w-[240px] truncate">
                  {cat.description || '—'}
                </td>
                <td className="px-3 py-2 text-center">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      cat.active
                        ? 'bg-emerald-50 text-[#107C41] border border-emerald-200'
                        : 'bg-slate-100 text-[#5C5C5C] border border-slate-200'
                    }`}
                  >
                    {cat.active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onToggleStatus(cat.id)}
                      title={cat.active ? 'Desactivar' : 'Activar'}
                      className="p-1.5 rounded hover:bg-[#F3F3F3] text-[#5C5C5C] hover:text-[#0067C0] transition-colors cursor-pointer"
                    >
                      {cat.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                    </button>
                    <button
                      onClick={() => onEdit(cat)}
                      title="Editar categoría"
                      className="p-1.5 rounded hover:bg-[#F3F3F3] text-[#5C5C5C] hover:text-[#0067C0] transition-colors cursor-pointer"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onDelete(cat)}
                      title="Eliminar categoría"
                      className="p-1.5 rounded hover:bg-red-50 text-[#5C5C5C] hover:text-[#C42B1C] transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <TablePagination
        page={pagination.page}
        pageSize={pagination.pageSize}
        totalItems={pagination.totalItems}
        totalPages={pagination.totalPages}
        onPageChange={pagination.setPage}
      />
    </div>
  )
}

export default CategoryTable
