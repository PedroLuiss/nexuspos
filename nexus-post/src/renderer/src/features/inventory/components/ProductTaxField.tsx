import React from 'react'
import { Percent, Info } from '../../../shared/icons/Icons'
import { useBusinessConfig } from '../../../shared/hooks/useBusinessConfig'
import { useTaxes } from '../../../shared/hooks/useTaxes'
import { formatTaxLabel, formatTaxRate } from '@shared/lib/tax'

interface ProductTaxFieldProps {
  /** Tasa asignada; vacío = se aplicará la predeterminada al guardar. */
  taxId: string
  onChange: (taxId: string) => void
  salePrice: number
}

const selectClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]'

/**
 * Selector de alícuota del producto.
 * Reemplaza el antiguo checkbox "IVA 8%": permite exento, general, reducido
 * y cualquier tasa personalizada creada en Ajustes › Impuestos.
 */
export const ProductTaxField: React.FC<ProductTaxFieldProps> = ({ taxId, onChange, salePrice }) => {
  const { config } = useBusinessConfig()
  const { taxes, defaultTax, isLoading, error } = useTaxes()

  const available = taxes.filter((tax) => tax.active || tax.id === taxId)
  const selected =
    available.find((tax) => tax.id === taxId) ??
    (defaultTax && available.some((tax) => tax.id === defaultTax.id) ? defaultTax : available[0])

  const rate = selected?.rate ?? 0
  const price = Number.isFinite(salePrice) ? salePrice : 0
  const netPrice = config.pricesIncludeTax ? price / (1 + rate / 100) : price
  const grossPrice = config.pricesIncludeTax ? price : price * (1 + rate / 100)

  return (
    <div>
      <label className="block text-xs font-medium text-slate-700 mb-1">Impuesto / Alícuota</label>
      <div className="relative">
        <select
          value={selected?.id ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={isLoading || available.length === 0}
          className={`${selectClass} pr-8 cursor-pointer disabled:cursor-not-allowed`}
        >
          {available.length === 0 && <option value="">Sin tasas configuradas</option>}
          {available.map((tax) => (
            <option key={tax.id} value={tax.id}>
              {formatTaxLabel(tax.name, tax.rate)}
              {tax.isDefault ? ' · predeterminada' : ''}
            </option>
          ))}
        </select>
        <Percent
          size={13}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      </div>

      <div className="mt-1 text-[10px] text-slate-500 leading-snug">
        <span className="font-mono">${netPrice.toFixed(2)}</span> sin impuesto
        <span className="mx-1 text-slate-300">·</span>
        <span className="font-mono font-semibold text-[#107C41]">${grossPrice.toFixed(2)}</span> con
        impuesto
        {config.pricesIncludeTax && rate > 0 && (
          <span className="ml-1 text-slate-400">
            (el precio ya lo incluye: {formatTaxRate(rate)} desagregado)
          </span>
        )}
      </div>

      {error && <p className="mt-1 text-[10px] font-semibold text-[#C42B1C]">{error}</p>}

      <p className="mt-1 flex items-start gap-1 text-[10px] text-slate-400 leading-snug">
        <Info size={11} className="mt-0.5 shrink-0" />
        <span>¿Necesitas otra alícuota? Créala en Ajustes › Impuestos.</span>
      </p>
    </div>
  )
}

export default ProductTaxField
