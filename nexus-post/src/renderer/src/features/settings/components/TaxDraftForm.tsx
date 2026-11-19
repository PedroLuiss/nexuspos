import React from 'react'
import { Check, X } from '../../../shared/icons/Icons'

export interface DraftTax {
  id?: string
  name: string
  rate: number
  code: string
  active: boolean
}

interface TaxDraftFormProps {
  draft: DraftTax
  assignedProductCount: number
  isSaving: boolean
  canEdit: boolean
  onChange: (draft: DraftTax) => void
  onCancel: () => void
  onSave: () => void
}

const inputClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0] disabled:bg-slate-50 disabled:text-slate-500'

export function TaxDraftForm({
  draft,
  assignedProductCount,
  isSaving,
  canEdit,
  onChange,
  onCancel,
  onSave
}: TaxDraftFormProps): React.JSX.Element {
  return (
    <div className="space-y-2 rounded-[4px] border border-[#0067C0]/40 bg-blue-50/40 p-2.5">
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2">
          <label className="mb-0.5 block text-[10px] font-semibold text-slate-700">Nombre</label>
          <input
            type="text"
            value={draft.name}
            maxLength={32}
            disabled={!canEdit || isSaving}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
            placeholder="IVA General"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] font-semibold text-slate-700">Tasa (%)</label>
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={draft.rate}
            disabled={!canEdit || isSaving}
            onChange={(event) => onChange({ ...draft, rate: Number(event.target.value) })}
            className={`${inputClass} text-right font-mono`}
          />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <div className="w-24">
          <label className="mb-0.5 block text-[10px] font-semibold text-slate-700">Código</label>
          <input
            type="text"
            value={draft.code}
            maxLength={4}
            disabled={!canEdit || isSaving}
            onChange={(event) => onChange({ ...draft, code: event.target.value.toUpperCase() })}
            placeholder="G"
            className={`${inputClass} font-mono`}
          />
        </div>
        <label className="flex cursor-pointer items-center gap-1.5 pb-1.5 text-[10px] font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={draft.active}
            disabled={!canEdit || isSaving}
            onChange={(event) => onChange({ ...draft, active: event.target.checked })}
            className="rounded border-slate-300 text-[#0067C0]"
          />
          Activa
        </label>
        <div className="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            disabled={isSaving}
            onClick={onCancel}
            className="flex cursor-pointer items-center gap-1 rounded-[4px] border border-slate-300 bg-white px-2 py-1 text-[10px] font-semibold text-slate-700 hover:bg-slate-50"
          >
            <X size={12} />
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canEdit || isSaving}
            onClick={onSave}
            className="flex cursor-pointer items-center gap-1 rounded-[4px] bg-[#0067C0] px-2.5 py-1 text-[10px] font-bold text-white hover:bg-[#0078D4] disabled:opacity-50"
          >
            <Check size={12} />
            {isSaving ? 'Guardando…' : draft.id ? 'Guardar tasa' : 'Crear tasa'}
          </button>
        </div>
      </div>
      {draft.id && (
        <p className="text-[10px] text-slate-500">
          Cambiar la tasa afecta a los {assignedProductCount} producto(s) que la usan y se aplicará
          a las ventas nuevas.
        </p>
      )}
    </div>
  )
}
