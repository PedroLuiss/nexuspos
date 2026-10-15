import React from 'react'
import { AlertCircle } from '../../../shared/icons/Icons'
import type { ProductStats } from '../hooks/useProductFilters'

interface ProductStatusBarProps {
  stats: ProductStats
}

export const ProductStatusBar: React.FC<ProductStatusBarProps> = ({ stats }) => {
  return (
    <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#F9F9F9] border-t border-[#E5E5E5] text-xs text-[#5C5C5C]">
      <div className="flex items-center gap-4">
        <span>
          Total Catálogo:{' '}
          <strong className="text-[#1B1B1B] font-mono">{stats.total}</strong> productos
        </span>
        <span>•</span>
        <span>
          Existencias Totales:{' '}
          <strong className="text-[#1B1B1B] font-mono">{stats.totalStock}</strong> unidades
        </span>
        <span>•</span>
        <span>
          Valuación Inventario (Costo):{' '}
          <strong className="text-[#107C41] font-mono font-bold">
            ${stats.totalValue.toFixed(2)}
          </strong>
        </span>
      </div>

      <div className="flex items-center gap-3">
        {stats.lowStock > 0 && (
          <span className="flex items-center gap-1 text-amber-700 font-semibold text-[11px]">
            <AlertCircle size={13} /> {stats.lowStock} con stock bajo
          </span>
        )}
        {stats.outOfStock > 0 && (
          <span className="flex items-center gap-1 text-[#C42B1C] font-semibold text-[11px]">
            <AlertCircle size={13} /> {stats.outOfStock} agotados
          </span>
        )}
      </div>
    </div>
  )
}

export default ProductStatusBar
