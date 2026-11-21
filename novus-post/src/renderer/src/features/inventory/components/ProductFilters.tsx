import React, { useEffect, useRef } from 'react'
import { Search, Filter } from '../../../shared/icons/Icons'
import type { StockFilter, TaxFilterOption } from '../hooks/useProductFilters'

interface ProductFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  categories: string[]
  selectedCategory: string
  onCategoryChange: (value: string) => void
  stockFilter: StockFilter
  onStockFilterChange: (value: StockFilter) => void
  taxOptions: TaxFilterOption[]
  selectedTax: string
  onTaxChange: (value: string) => void
  brandOptions: TaxFilterOption[]
  selectedBrand: string
  onBrandChange: (value: string) => void
  supplierOptions: TaxFilterOption[]
  selectedSupplier: string
  onSupplierChange: (value: string) => void
  typeOptions: TaxFilterOption[]
  selectedType: string
  onTypeChange: (value: string) => void
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
  taxOptions,
  selectedTax,
  onTaxChange,
  brandOptions,
  selectedBrand,
  onBrandChange,
  supplierOptions,
  selectedSupplier,
  onSupplierChange,
  typeOptions,
  selectedType,
  onTypeChange,
  counts
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (
        event.key !== 'F2' ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.getModifierState('AltGraph') ||
        document.querySelector('[aria-modal="true"], [role="dialog"], .fixed.inset-0')
      ) {
        return
      }

      event.preventDefault()
      searchInputRef.current?.focus()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="relative flex-1 min-w-[260px] max-w-sm">
        <Search size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#717783]" />
        <input
          ref={searchInputRef}
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

        {taxOptions.length > 0 && (
          <select
            value={selectedTax}
            onChange={(e) => onTaxChange(e.target.value)}
            title="Filtrar por impuesto"
            className="px-2.5 py-1.5 text-xs bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B] font-medium"
          >
            <option value="ALL">Todos los impuestos</option>
            {taxOptions.map((tax) => (
              <option key={tax.value} value={tax.value}>
                {tax.label}
              </option>
            ))}
          </select>
        )}

        {brandOptions.length > 0 && (
          <select
            value={selectedBrand}
            onChange={(e) => onBrandChange(e.target.value)}
            title="Filtrar por marca"
            className="px-2.5 py-1.5 text-xs bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B] font-medium"
          >
            <option value="ALL">Todas las marcas</option>
            {brandOptions.map((brand) => (
              <option key={brand.value} value={brand.value}>
                {brand.label}
              </option>
            ))}
          </select>
        )}

        {supplierOptions.length > 0 && (
          <select
            value={selectedSupplier}
            onChange={(e) => onSupplierChange(e.target.value)}
            title="Filtrar por proveedor"
            className="px-2.5 py-1.5 text-xs bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B] font-medium"
          >
            <option value="ALL">Todos los proveedores</option>
            {supplierOptions.map((supplier) => (
              <option key={supplier.value} value={supplier.value}>
                {supplier.label}
              </option>
            ))}
          </select>
        )}

        {typeOptions.length > 0 && (
          <select
            value={selectedType}
            onChange={(e) => onTypeChange(e.target.value)}
            title="Filtrar por tipo de producto"
            className="px-2.5 py-1.5 text-xs bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B] font-medium"
          >
            <option value="ALL">Todos los tipos</option>
            {typeOptions.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        )}

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
