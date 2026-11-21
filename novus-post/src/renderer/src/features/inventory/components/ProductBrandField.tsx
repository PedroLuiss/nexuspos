import React from 'react'
import { Info } from '../../../shared/icons/Icons'
import { useBrands } from '../../../shared/hooks/useBrands'

interface ProductBrandFieldProps {
  /** ID de la marca asignada; vacío = se usará la predeterminada al guardar. */
  brandId: string
  onChange: (brandId: string) => void
}

const selectClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]'

/** Selector de marca del producto. */
export const ProductBrandField: React.FC<ProductBrandFieldProps> = ({
  brandId,
  onChange
}) => {
  const { brands, isLoading, error } = useBrands()

  const available = brands.filter((b) => b.active || b.id === brandId)
  const selected =
    available.find((b) => b.id === brandId) ?? available[0]

  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">
        Marca
      </label>
      <select
        value={selected?.id ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading || available.length === 0}
        className={`${selectClass} disabled:cursor-not-allowed`}
      >
        {available.length === 0 && <option value="">Sin marcas configuradas</option>}
        {available.map((brand) => (
          <option key={brand.id} value={brand.id}>
            {brand.name}
          </option>
        ))}
      </select>

      {error && (
        <p className="mt-1 text-[10px] font-semibold text-[#C42B1C]">{error}</p>
      )}

      <p className="mt-1 flex items-start gap-1 text-[10px] text-slate-400 leading-snug">
        <Info size={11} className="mt-0.5 shrink-0" />
        <span>¿Necesitas otra marca? Créala en Ajustes › Catálogos.</span>
      </p>
    </div>
  )
}

export default ProductBrandField
