import React from 'react'
import type { ProductFormValues } from '../hooks/useProductForm'

interface ProductPricingFieldsProps {
  values: ProductFormValues
  update: <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => void
  marginDollar: number
  marginPercent: string
}

export const ProductPricingFields: React.FC<ProductPricingFieldsProps> = ({
  values,
  update,
  marginDollar,
  marginPercent
}) => {
  return (
    <div className="space-y-4">
      <div className="border-b border-slate-100 pb-2">
        <span className="text-xs font-semibold text-[#0078D4] uppercase tracking-wider">
          Precios, Stock & Estado
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Precio Costo ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.costPrice}
            onChange={(e) => update('costPrice', Number(e.target.value))}
            className="w-full px-3 py-1.5 text-xs font-code bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Precio Venta ($) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            required
            value={values.salePrice}
            onChange={(e) => update('salePrice', Number(e.target.value))}
            className="w-full px-3 py-1.5 text-xs font-code bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
          />
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-sm">
        <span className="text-[11px] font-medium text-slate-600">Margen de Ganancia</span>
        <span
          className={`text-xs font-bold font-code ${
            marginDollar >= 0 ? 'text-[#107C41]' : 'text-[#C42B1C]'
          }`}
        >
          ${marginDollar.toFixed(2)} ({marginPercent}%)
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Stock</label>
          <input
            type="number"
            min="0"
            value={values.stock}
            onChange={(e) => update('stock', Number(e.target.value))}
            className="w-full px-3 py-1.5 text-xs font-code bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Mínimo</label>
          <input
            type="number"
            min="0"
            value={values.minStock}
            onChange={(e) => update('minStock', Number(e.target.value))}
            className="w-full px-3 py-1.5 text-xs font-code bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
          />
        </div>
        <div className="flex items-end pb-1.5">
          <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={values.hasTax}
              onChange={(e) => update('hasTax', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#0078D4] focus:ring-[#0078D4]"
            />
            IVA 16%
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-200">
        <div>
          <span className="block text-xs font-medium text-slate-800">Estado del Producto</span>
          <span className="block text-[11px] text-slate-500">
            {values.active ? 'Visible en caja para venta' : 'Oculto / Desactivado'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => update('active', !values.active)}
          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
            values.active ? 'bg-[#0078D4]' : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              values.active ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  )
}

export default ProductPricingFields
