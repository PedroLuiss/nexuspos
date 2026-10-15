import React from 'react'
import { Search, Filter } from '../../../shared/icons/Icons'
import type { StockFilter } from '../hooks/useProductFilters'

interface ProductFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  categories: string[]
  selectedCategory: string
  onCategoryChange: (value: string) => void
  stockFilter: StockFilter
  onStockFilterChange: (value: StockFilter) => void
  counts: { all: number; low: number; out: number }
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchTerm,
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  stockFilter,
  onStockFilterChange,
  counts
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="relative flex-1 min-w-[260px] max-w-sm">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#717783]" />
        <input
          type="text"
          placeholder="Buscar por código, descripción o categoría [F2]..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] focus:bg-white focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0] text-[#1B1B1B]"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <Filter size={14} className="text-[#717783]" />
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B] font-medium"
          >
            <option value="ALL">Todas las Categorías</option>
            {categories
              .filter((c) => c !== 'ALL')
              .map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-center gap-1 bg-[#F3F3F3] p-0.5 rounded-[4px] border border-[#E5E5E5] text-xs">
          <button
            onClick={() => onStockFilterChange('ALL')}
            className={`px-2.5 py-1 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer ${
              stockFilter === 'ALL'
                ? 'bg-white text-[#0067C0] shadow-xs'
                : 'text-[#5C5C5C] hover:text-[#1B1B1B]'
            }`}
          >
            Todos ({counts.all})
          </button>
          <button
            onClick={() => onStockFilterChange('LOW')}
            className={`px-2.5 py-1 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer ${
              stockFilter === 'LOW'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-[#5C5C5C] hover:text-[#1B1B1B]'
            }`}
          >
            Bajo Stock ({counts.low})
          </button>
          <button
            onClick={() => onStockFilterChange('OUT')}
            className={`px-2.5 py-1 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer ${
              stockFilter === 'OUT'
                ? 'bg-white text-[#C42B1C] shadow-xs'
                : 'text-[#5C5C5C] hover:text-[#1B1B1B]'
            }`}
          >
            Agotados ({counts.out})
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductFilters
