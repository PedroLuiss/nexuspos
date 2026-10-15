import React from 'react'
import { Barcode } from '../../../shared/icons/Icons'
import type { ProductFormValues } from '../hooks/useProductForm'

interface ProductBasicFieldsProps {
  values: ProductFormValues
  update: <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => void
  categories: string[]
  units: string[]
  onGenerateCode: () => void
}

export const ProductBasicFields: React.FC<ProductBasicFieldsProps> = ({
  values,
  update,
  categories,
  units,
  onGenerateCode
}) => {
  return (
    <div className="space-y-4">
      <div className="border-b border-slate-100 pb-2">
        <span className="text-xs font-semibold text-[#0078D4] uppercase tracking-wider">
          Información Básica
        </span>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Código de Barras / SKU <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Barcode size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              placeholder="Escanear o ingresar código"
              value={values.code}
              onChange={(e) => update('code', e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs font-code bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
            />
          </div>
          <button
            type="button"
            onClick={onGenerateCode}
            className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-sm text-slate-700 whitespace-nowrap transition-colors"
          >
            Generar
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Nombre del Producto <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="Ej. Refresco Cola 600ml Desechable"
          value={values.name}
          onChange={(e) => update('name', e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Categoría</label>
        <select
          value={values.category}
          onChange={(e) => update('category', e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">Unidad de Medida</label>
        <select
          value={values.unit}
          onChange={(e) => update('unit', e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
        >
          {units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Descripción o Notas (Opcional)
        </label>
        <textarea
          rows={2}
          placeholder="Detalles sobre presentación, sabor, lote o proveedor..."
          value={values.description}
          onChange={(e) => update('description', e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] resize-none"
        />
      </div>
    </div>
  )
}

export default ProductBasicFields
