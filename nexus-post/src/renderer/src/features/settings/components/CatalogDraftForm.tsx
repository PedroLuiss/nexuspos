import React from 'react'
import { Check, X } from '../../../shared/icons/Icons'

export interface CatalogDraft {
  id?: string
  name: string
  active: boolean
}

interface CatalogDraftFormProps {
  draft: CatalogDraft
  entityName: string
  placeholderName: string
  canEdit: boolean
  isSaving: boolean
  onChange: (draft: CatalogDraft) => void
  onCancel: () => void
  onSave: () => void
}

const inputClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0] disabled:bg-slate-50 disabled:text-slate-500'

export function CatalogDraftForm({
  draft,
  entityName,
  placeholderName,
  canEdit,
  isSaving,
  onChange,
  onCancel,
  onSave
}: CatalogDraftFormProps): React.JSX.Element {
  return (
    <div className="space-y-2 rounded-[4px] border border-[#0067C0]/40 bg-blue-50/40 p-2.5">
      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="mb-0.5 block text-[10px] font-semibold text-slate-700">Nombre</label>
          <input
            type="text"
            value={draft.name}
            maxLength={64}
            disabled={!canEdit || isSaving}
            onChange={(event) => onChange({ ...draft, name: event.target.value })}
            placeholder={placeholderName}
            className={inputClass}
          />
        </div>
      </div>
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
          {isSaving ? 'Guardando…' : draft.id ? `Guardar ${entityName}` : `Crear ${entityName}`}
        </button>
      </div>
    </div>
  )
}
