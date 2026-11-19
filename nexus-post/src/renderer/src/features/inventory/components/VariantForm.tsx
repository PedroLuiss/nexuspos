import React from 'react'
import type { Product } from '@shared/contracts'
import { Check, X, AlertCircle } from '../../../shared/icons/Icons'
import { CurrencyInput } from '../../../shared/ui/CurrencyInput'

const inputClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]'

export interface VariantDraft {
  id?: string
  name: string
  code: string
  costPrice: string
  salePrice: string
  stock: string
  values: Record<string, string>
}

interface VariantFormProps {
  draft: VariantDraft
  parent: Product
  attributeNames: string[]
  isSaving: boolean
  error: string | null
  onChange: (draft: VariantDraft) => void
  onSave: () => void
  onCancel: () => void
}

/** Formulario de alta/edición de una variante (extraído de VariantEditor para cumplir 300 líneas). */
export const VariantForm: React.FC<VariantFormProps> = ({
  draft,
  parent,
  attributeNames,
  isSaving,
  error,
  onChange,
  onSave,
  onCancel
}) => {
  return (
    <div className="p-2.5 border border-[#0067C0]/40 bg-blue-50/40 rounded-[4px] space-y-2">
      {error && (
        <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded-[4px] text-[11px] text-red-700 font-semibold">
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-2">
          <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Nombre</label>
          <input
            type="text"
            value={draft.name}
            onChange={(e) => onChange({ ...draft, name: e.target.value })}
            placeholder={`${parent.name} - variante`}
            className={inputClass}
          />
        </div>
        <div className="col-span-2">
          <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">SKU</label>
          <input
            type="text"
            value={draft.code}
            onChange={(e) => onChange({ ...draft, code: e.target.value })}
            placeholder={`${parent.code}-VAR`}
            className={inputClass}
          />
        </div>
        {attributeNames.map((n) => (
          <div key={n} className="col-span-2">
            <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">{n}</label>
            <input
              type="text"
              value={draft.values[n] ?? ''}
              onChange={(e) =>
                onChange({ ...draft, values: { ...draft.values, [n]: e.target.value } })
              }
              placeholder={n}
              className={inputClass}
            />
          </div>
        ))}
        <div>
          <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Costo</label>
          <CurrencyInput
            min="0"
            value={Number(draft.costPrice) || 0}
            onValueChange={(costPrice) => onChange({ ...draft, costPrice: costPrice.toFixed(2) })}
            className={`${inputClass} font-mono`}
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Precio</label>
          <CurrencyInput
            min="0"
            value={Number(draft.salePrice) || 0}
            onValueChange={(salePrice) => onChange({ ...draft, salePrice: salePrice.toFixed(2) })}
            className={`${inputClass} font-mono`}
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Stock</label>
          <input
            type="number"
            step="0.001"
            value={draft.stock}
            onChange={(e) => onChange({ ...draft, stock: e.target.value })}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-700 bg-white border border-slate-300 rounded-[4px] hover:bg-slate-50 cursor-pointer"
        >
          <X size={12} />
          Cancelar
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={onSave}
          className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] rounded-[4px] disabled:opacity-50 cursor-pointer"
        >
          <Check size={12} />
          {isSaving ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

export default VariantForm
