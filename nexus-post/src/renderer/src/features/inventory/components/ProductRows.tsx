import React from 'react'
import type { Product } from '@shared/contracts'
import { Package, Power, Edit3, Trash2 } from '../../../shared/icons/Icons'

interface ProductRowsProps {
  products: Product[]
  selectedProductId: string | null
  onSelect: (id: string) => void
  onToggleStatus: (id: string) => void
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export const ProductRows: React.FC<ProductRowsProps> = ({
  products,
  selectedProductId,
  onSelect,
  onToggleStatus,
  onEdit,
  onDelete
}) => {
  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="sticky top-0 z-10 bg-[#F9F9F9] border-b border-[#E5E5E5] text-[#1B1B1B] font-semibold text-xs">
          <tr>
            <th className="py-2 px-3 text-left">Código / SKU</th>
            <th className="py-2 px-3 text-left">Producto</th>
            <th className="py-2 px-3 text-right">Costo</th>
            <th className="py-2 px-3 text-right">Venta</th>
            <th className="py-2 px-3 text-center">Stock</th>
            <th className="py-2 px-3 text-center">Mín.</th>
            <th className="py-2 px-3 text-center">Categoría</th>
            <th className="py-2 px-3 text-center">Estado</th>
            <th className="py-2 px-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E5E5]">
          {products.length === 0 ? (
            <tr>
              <td colSpan={9} className="py-20 text-center text-[#717783]">
                <Package size={40} className="mx-auto mb-2 text-[#D1D1D1]" />
                <p className="text-xs font-semibold text-[#1B1B1B]">
                  No se encontraron productos registrados
                </p>
              </td>
            </tr>
          ) : (
            products.map((p) => {
              const isLow = p.stock > 0 && p.stock <= p.minStock
              const isOut = p.stock === 0
              const isSelected = selectedProductId === p.id

              return (
                <tr
                  key={p.id}
                  onClick={() => onSelect(p.id)}
                  className={`transition-colors cursor-pointer group ${
                    isSelected
                      ? 'bg-[#EBF0F5] border-l-4 border-l-[#0067C0]'
                      : 'even:bg-[#FDFDFD] hover:bg-[#F9F9F9]'
                  }`}
                  style={{ height: '40px' }}
                >
                  <td className="py-2 px-3 font-mono text-xs text-[#5C5C5C] font-semibold">
                    {p.code}
                  </td>

                  <td className="py-2 px-3">
                    <div className="font-semibold text-xs text-[#1B1B1B]">{p.name}</div>
                    {p.description && (
                      <div className="text-[10px] text-[#717783] truncate max-w-sm">
                        {p.description}
                      </div>
                    )}
                  </td>

                  <td className="py-2 px-3 text-right font-mono text-[#5C5C5C]">
                    ${p.costPrice.toFixed(2)}
                  </td>

                  <td className="py-2 px-3 text-right font-mono font-bold text-[#107C41]">
                    ${p.salePrice.toFixed(2)}
                  </td>

                  <td className="py-2 px-3 text-center font-mono font-bold">
                    <span
                      className={
                        isOut ? 'text-[#C42B1C]' : isLow ? 'text-amber-600' : 'text-[#1B1B1B]'
                      }
                    >
                      {p.stock}
                    </span>
                    <span className="text-[10px] font-normal text-[#717783] ml-1">
                      {p.unit.split(' ')[0]}
                    </span>
                  </td>

                  <td className="py-2 px-3 text-center font-mono text-[#717783]">{p.minStock}</td>

                  <td className="py-2 px-3 text-center">
                    <span className="inline-block px-1.5 py-0.5 text-[10px] font-semibold text-[#5C5C5C] bg-[#F3F3F3] border border-[#E5E5E5] rounded-[3px]">
                      {p.category}
                    </span>
                  </td>

                  <td className="py-2 px-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.active
                          ? 'bg-emerald-50 text-[#107C41] border border-emerald-200'
                          : 'bg-[#EBEBEB] text-[#717783] border border-[#D1D1D1]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          p.active ? 'bg-[#107C41]' : 'bg-[#717783]'
                        }`}
                      ></span>
                      {p.active ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>

                  <td className="py-2 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleStatus(p.id)
                        }}
                        title={p.active ? 'Desactivar producto' : 'Activar producto'}
                        className="p-1 rounded text-[#717783] hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                      >
                        <Power size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(p)
                        }}
                        title="Editar ficha"
                        className="p-1 rounded text-[#717783] hover:text-[#0067C0] hover:bg-blue-50 cursor-pointer"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(p)
                        }}
                        title="Eliminar producto"
                        className="p-1 rounded text-[#717783] hover:text-[#C42B1C] hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

export default ProductRows
