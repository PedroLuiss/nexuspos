import React from 'react'
import type { ProductFormValues } from '../hooks/useProductForm'
import { Sparkles } from '../../../shared/icons/Icons'
import { CurrencyInput } from '../../../shared/ui/CurrencyInput'
import ProductTaxField from './ProductTaxField'
import { getProductQuantityStep } from '@shared/lib/product-quantity'

interface ProductPricingFieldsProps {
  values: ProductFormValues
  update: <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => void
  setCostPrice: (cost: number) => void
  setProfitMarginPercent: (margin: number) => void
  setSalePrice: (sale: number) => void
  marginDollar: number
  marginPercent: string
  isEditing: boolean
  canModifyPrice: boolean
  canAdjustStock: boolean
  canDeleteProduct: boolean
}

const PRESET_MARGINS = [10, 15, 20, 25, 30, 50]

export const ProductPricingFields: React.FC<ProductPricingFieldsProps> = ({
  values,
  update,
  setCostPrice,
  setProfitMarginPercent,
  setSalePrice,
  marginDollar,
  isEditing,
  canModifyPrice,
  canAdjustStock,
  canDeleteProduct
}) => {
  const quantityStep = getProductQuantityStep(values.unit)
  const pricingDisabled = isEditing && !canModifyPrice

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-100 pb-2">
        <span className="text-xs font-semibold text-[#0067C0] uppercase tracking-wider">
          Cálculo de Precios y Margen de Ganancia
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* Precio de Costo */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Precio Costo ($) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              $
            </span>
            <CurrencyInput
              min="0"
              required
              value={values.costPrice}
              onValueChange={setCostPrice}
              disabled={pricingDisabled}
              className="w-full pl-6 pr-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
            />
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Costo de compra</span>
        </div>

        {/* % de Ganancia */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Ganancia (%) <span className="text-[#107C41] font-bold">[Auto-calcula Venta]</span>
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.5"
              value={values.profitMarginPercent ?? 10}
              onChange={(e) => setProfitMarginPercent(parseFloat(e.target.value) || 0)}
              disabled={pricingDisabled}
              className="w-full pl-3 pr-7 py-1.5 text-xs font-mono font-bold text-[#107C41] bg-emerald-50/40 border border-emerald-300 rounded-[4px] focus:border-[#107C41] focus:ring-1 focus:ring-[#107C41]"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#107C41]">
              %
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">
            Ej: 10% de $100 = $10 ganancia
          </span>
        </div>
      </div>

      {/* Botones de porcentaje rápido */}
      <div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1">
          <Sparkles size={12} className="text-[#0067C0]" />
          <span>Porcentajes sugeridos de ganancia:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_MARGINS.map((pct) => {
            const isSelected = Math.abs(values.profitMarginPercent - pct) < 0.1
            return (
              <button
                key={pct}
                type="button"
                onClick={() => setProfitMarginPercent(pct)}
                disabled={pricingDisabled}
                className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-[4px] border transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                  isSelected
                    ? 'bg-[#107C41] text-white border-[#107C41] shadow-2xs'
                    : 'bg-white hover:bg-emerald-50 text-slate-700 border-slate-300'
                }`}
              >
                +{pct}%
              </button>
            )
          })}
        </div>
      </div>

      {/* Recuadro de Precio de Venta Calculado Automáticamente */}
      <div className="p-3 bg-gradient-to-r from-emerald-50/70 to-blue-50/70 border border-emerald-300/80 rounded-[6px] shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Precio de Venta Final
            </span>
            <div className="text-xl font-mono font-extrabold text-[#107C41] mt-0.5">
              ${values.salePrice.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase font-semibold block">
              Ganancia Neta
            </span>
            <span className="text-xs font-mono font-bold text-[#107C41] bg-white px-2 py-0.5 rounded border border-emerald-200 inline-block mt-0.5">
              +${marginDollar.toFixed(2)} ({values.profitMarginPercent.toFixed(1)}%)
            </span>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-slate-600">
          <span>
            Fórmula: ${values.costPrice.toFixed(2)} costo + ${marginDollar.toFixed(2)} (
            {values.profitMarginPercent.toFixed(1)}%)
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400">¿Ajuste directo?</span>
            <CurrencyInput
              min="0"
              value={values.salePrice}
              onValueChange={setSalePrice}
              disabled={pricingDisabled}
              title="Permite ajustar el precio de venta final manualmente si es necesario"
              className="w-20 px-1.5 py-0.5 text-xs font-mono text-right bg-white border border-slate-300 rounded focus:border-[#0067C0]"
            />
          </div>
        </div>
      </div>

      {/* Stock y mínimo */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Stock Inicial</label>
          <input
            type="number"
            min="0"
            step={quantityStep}
            value={values.stock}
            onChange={(e) => update('stock', Number(e.target.value))}
            disabled={!canAdjustStock}
            className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Stock Mínimo</label>
          <input
            type="number"
            min="0"
            step={quantityStep}
            value={values.minStock}
            onChange={(e) => update('minStock', Number(e.target.value))}
            className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]"
          />
        </div>
      </div>

      {/* Impuesto / alícuota del producto */}
      <ProductTaxField
        taxId={values.taxId}
        onChange={(taxId) => update('taxId', taxId)}
        salePrice={values.salePrice}
      />

      {/* Estado del producto */}
      <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-[4px] border border-slate-200">
        <div>
          <span className="block text-xs font-medium text-slate-800">Estado del Producto</span>
          <span className="block text-[11px] text-slate-500">
            {values.active ? 'Visible en caja para cobro' : 'Oculto / Desactivado'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => update('active', !values.active)}
          disabled={!canDeleteProduct}
          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-50 ${
            values.active ? 'bg-[#0067C0]' : 'bg-slate-300'
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
