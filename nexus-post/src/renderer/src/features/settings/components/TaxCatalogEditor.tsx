import React, { useState } from 'react'
import type { TaxInput, TaxRate } from '@shared/contracts'
import { formatTaxLabel, formatTaxRate } from '@shared/lib/tax'
import type { UseTaxesResult } from '../../../shared/hooks/useTaxes'
import { Check, Edit3, Plus, Star, Trash2, X, AlertCircle } from '../../../shared/icons/Icons'

type Catalog = Pick<UseTaxesResult, 'createTax' | 'updateTax' | 'deleteTax' | 'setDefaultTax'>

interface TaxCatalogEditorProps extends Catalog {
  taxes: TaxRate[]
  canEdit: boolean
  error: string | null
}

const inputClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0] disabled:bg-slate-50 disabled:text-slate-500'

interface DraftTax {
  id?: string
  name: string
  rate: number
  code: string
  active: boolean
}

const EMPTY_DRAFT: DraftTax = { name: '', rate: 16, code: '', active: true }

/** CRUD del catálogo de alícuotas (IVA general, reducido, exento, personalizadas). */
export const TaxCatalogEditor: React.FC<TaxCatalogEditorProps> = ({
  taxes,
  canEdit,
  error,
  createTax,
  updateTax,
  deleteTax,
  setDefaultTax
}) => {
  const [draft, setDraft] = useState<DraftTax | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const startCreate = (): void => {
    setFormError(null)
    setDraft({ ...EMPTY_DRAFT })
  }

  const startEdit = (tax: TaxRate): void => {
    setFormError(null)
    setDraft({
      id: tax.id,
      name: tax.name,
      rate: tax.rate,
      code: tax.code ?? '',
      active: tax.active
    })
  }

  const handleSave = async (): Promise<void> => {
    if (!draft) return
    const name = draft.name.trim()
    if (!name) {
      setFormError('Indique el nombre de la tasa (ej. IVA General).')
      return
    }
    if (!Number.isFinite(draft.rate) || draft.rate < 0 || draft.rate > 100) {
      setFormError('La tasa debe ser un porcentaje entre 0 y 100.')
      return
    }

    const payload: TaxInput = {
      name,
      rate: draft.rate,
      code: draft.code.trim() || undefined,
      isDefault: draft.id ? (taxes.find((tax) => tax.id === draft.id)?.isDefault ?? false) : false,
      active: draft.active
    }

    setIsSaving(true)
    setFormError(null)
    try {
      if (draft.id) {
        const existing = taxes.find((tax) => tax.id === draft.id)
        if (!existing) throw new Error('La tasa ya no existe. Recargue la pantalla.')
        await updateTax({ ...existing, ...payload })
      } else {
        await createTax(payload)
      }
      setDraft(null)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar la tasa.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (tax: TaxRate): Promise<void> => {
    if (!canEdit) return
    if (
      !window.confirm(
        `¿Eliminar la tasa "${tax.name}"? Los productos deben tener otra tasa asignada.`
      )
    ) {
      return
    }
    setFormError(null)
    try {
      await deleteTax(tax.id)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo eliminar la tasa.')
    }
  }

  const handleSetDefault = async (tax: TaxRate): Promise<void> => {
    if (!canEdit) return
    setFormError(null)
    try {
      await setDefaultTax(tax.id)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo cambiar la predeterminada.')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700">
          Catálogo de alícuotas
        </span>
        <button
          type="button"
          disabled={!canEdit || draft !== null}
          onClick={startCreate}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#0067C0] bg-blue-50 border border-blue-200 rounded-[4px] hover:bg-blue-100 disabled:opacity-50 cursor-pointer"
        >
          <Plus size={12} />
          Nueva tasa
        </button>
      </div>

      {(formError || error) && (
        <div className="flex items-start gap-1.5 p-2 bg-red-50 border border-red-200 rounded-[4px] text-[11px] text-red-700 font-semibold">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span>{formError ?? error}</span>
        </div>
      )}

      <div className="border border-slate-200 rounded-[4px] overflow-hidden">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-50 text-slate-600 font-semibold">
            <tr>
              <th className="py-1.5 px-2">Tasa</th>
              <th className="py-1.5 px-2 text-right">%</th>
              <th className="py-1.5 px-2 text-center">Productos</th>
              <th className="py-1.5 px-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {taxes.length === 0 && (
              <tr>
                <td colSpan={4} className="py-3 px-2 text-center text-slate-500">
                  No hay tasas configuradas. Cree al menos una para poder facturar.
                </td>
              </tr>
            )}
            {taxes.map((tax) => (
              <tr key={tax.id} className={tax.active ? '' : 'opacity-60'}>
                <td className="py-1.5 px-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800">
                      {formatTaxLabel(tax.name, tax.rate)}
                    </span>
                    {tax.isDefault && (
                      <span className="text-[9px] font-bold uppercase text-[#107C41] bg-emerald-50 border border-emerald-200 rounded-[3px] px-1">
                        Predeterminada
                      </span>
                    )}
                    {!tax.active && (
                      <span className="text-[9px] font-bold uppercase text-slate-500 bg-slate-100 border border-slate-200 rounded-[3px] px-1">
                        Inactiva
                      </span>
                    )}
                  </div>
                  {tax.code && (
                    <span className="text-[10px] text-slate-400">Código {tax.code}</span>
                  )}
                </td>
                <td className="py-1.5 px-2 text-right font-mono">{formatTaxRate(tax.rate)}</td>
                <td className="py-1.5 px-2 text-center font-mono text-slate-500">
                  {tax.productCount ?? 0}
                </td>
                <td className="py-1.5 px-2">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      disabled={!canEdit || tax.isDefault}
                      onClick={() => void handleSetDefault(tax)}
                      title="Marcar como predeterminada"
                      className="p-1 rounded text-[#717783] hover:text-[#107C41] hover:bg-emerald-50 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Star size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => startEdit(tax)}
                      title="Editar tasa"
                      className="p-1 rounded text-[#717783] hover:text-[#0067C0] hover:bg-blue-50 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={!canEdit || tax.isDefault || (tax.productCount ?? 0) > 0}
                      onClick={() => void handleDelete(tax)}
                      title={
                        tax.isDefault
                          ? 'Asigne otra tasa predeterminada antes de eliminar'
                          : (tax.productCount ?? 0) > 0
                            ? 'Tiene productos asignados'
                            : 'Eliminar tasa'
                      }
                      className="p-1 rounded text-[#717783] hover:text-[#C42B1C] hover:bg-red-50 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {draft && (
        <div className="p-2.5 border border-[#0067C0]/40 bg-blue-50/40 rounded-[4px] space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                Nombre
              </label>
              <input
                type="text"
                value={draft.name}
                maxLength={32}
                disabled={!canEdit || isSaving}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="IVA General"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                Tasa (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.01}
                value={draft.rate}
                disabled={!canEdit || isSaving}
                onChange={(e) => setDraft({ ...draft, rate: Number(e.target.value) })}
                className={`${inputClass} font-mono text-right`}
              />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="w-24">
              <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                Código
              </label>
              <input
                type="text"
                value={draft.code}
                maxLength={4}
                disabled={!canEdit || isSaving}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                placeholder="G"
                className={`${inputClass} font-mono`}
              />
            </div>
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 pb-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.active}
                disabled={!canEdit || isSaving}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                className="rounded border-slate-300 text-[#0067C0]"
              />
              Activa
            </label>
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setDraft(null)}
                className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-700 bg-white border border-slate-300 rounded-[4px] hover:bg-slate-50 cursor-pointer"
              >
                <X size={12} />
                Cancelar
              </button>
              <button
                type="button"
                disabled={!canEdit || isSaving}
                onClick={() => void handleSave()}
                className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] rounded-[4px] disabled:opacity-50 cursor-pointer"
              >
                <Check size={12} />
                {isSaving ? 'Guardando…' : draft.id ? 'Guardar tasa' : 'Crear tasa'}
              </button>
            </div>
          </div>
          {draft.id && (
            <p className="text-[10px] text-slate-500">
              Cambiar la tasa afecta a los{' '}
              {taxes.find((tax) => tax.id === draft.id)?.productCount ?? 0} producto(s) que la usan
              y se aplicará a las ventas nuevas.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default TaxCatalogEditor
