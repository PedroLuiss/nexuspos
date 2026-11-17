import React from 'react'
import { Info } from '../../../shared/icons/Icons'
import { useProductTypes } from '../../../shared/hooks/useProductTypes'

interface ProductTypeFieldProps {
  /** ID del tipo de producto asignado. */
  typeId: string
  onChange: (typeId: string) => void
}

const selectClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]'

const KIND_BADGE: Record<string, { label: string; color: string }> = {
  simple: { label: 'Simple', color: 'text-slate-500' },
  combo: { label: 'Combo / Kit', color: 'text-[#107C41]' },
  service: { label: 'Servicio', color: 'text-[#0067C0]' },
  raw_material: { label: 'Insumo', color: 'text-amber-700' }
}

/** Selector de tipo de producto. Determina si el producto lleva stock físico. */
export const ProductTypeField: React.FC<ProductTypeFieldProps> = ({
  typeId,
  onChange
}) => {
  const { types, isLoading, error } = useProductTypes()

  const available = types.filter((t) => t.active || t.id === typeId)
  const selected =
    available.find((t) => t.id === typeId) ?? available[0]
  const badge = KIND_BADGE[selected?.kind ?? 'simple']

  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">
        Tipo de Producto
      </label>
      <select
        value={selected?.id ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading || available.length === 0}
        className={`${selectClass} disabled:cursor-not-allowed`}
      >
        {available.length === 0 && (
          <option value="">Sin tipos configurados</option>
        )}
        {available.map((type) => (
          <option key={type.id} value={type.id}>
            {type.name} ({badge.label})
          </option>
        ))}
      </select>

      {selected && (
        <p className="mt-1 text-[10px] text-slate-400">
          {selected.trackStock ? 'Con control de stock' : 'Sin control de stock (servicio)'}
        </p>
      )}

      {error && (
        <p className="mt-1 text-[10px] font-semibold text-[#C42B1C]">{error}</p>
      )}

      <p className="mt-1 flex items-start gap-1 text-[10px] text-slate-400 leading-snug">
        <Info size={11} className="mt-0.5 shrink-0" />
        <span>¿Necesitas otro tipo? Créalo en Ajustes › Catálogos.</span>
      </p>
    </div>
  )
}

export default ProductTypeField
