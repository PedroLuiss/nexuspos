import React from 'react'
import { Info } from '../../../shared/icons/Icons'
import { useSuppliers } from '../../../shared/hooks/useSuppliers'

interface ProductSupplierFieldProps {
  /** ID del proveedor asignado; vacío = sin proveedor específico. */
  supplierId: string
  onChange: (supplierId: string) => void
}

const selectClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]'

/** Selector de proveedor del producto. */
export const ProductSupplierField: React.FC<ProductSupplierFieldProps> = ({
  supplierId,
  onChange
}) => {
  const { suppliers, isLoading, error } = useSuppliers()

  const available = suppliers.filter((s) => s.active || s.id === supplierId)
  const selected =
    available.find((s) => s.id === supplierId) ?? available[0]

  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">
        Proveedor
      </label>
      <select
        value={selected?.id ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading || available.length === 0}
        className={`${selectClass} disabled:cursor-not-allowed`}
      >
        <option value="">Sin proveedor asignado</option>
        {available.length === 0 && (
          <option value="">Sin proveedores configurados</option>
        )}
        {available.map((supplier) => (
          <option key={supplier.id} value={supplier.id}>
            {supplier.name}
          </option>
        ))}
      </select>

      {error && (
        <p className="mt-1 text-[10px] font-semibold text-[#C42B1C]">{error}</p>
      )}

      <p className="mt-1 flex items-start gap-1 text-[10px] text-slate-400 leading-snug">
        <Info size={11} className="mt-0.5 shrink-0" />
        <span>¿Necesitas otro proveedor? Créalo en Ajustes › Catálogos.</span>
      </p>
    </div>
  )
}

export default ProductSupplierField
