import React, { useState } from 'react'
import type { TaxInput, TaxRate } from '@shared/contracts'
import { formatTaxLabel, formatTaxRate } from '@shared/lib/tax'
import type { UseTaxesResult } from '../../../shared/hooks/useTaxes'
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog'
import { Edit3, Plus, Star, Trash2, AlertCircle } from '../../../shared/icons/Icons'
import { TaxDraftForm, type DraftTax } from './TaxDraftForm'

type Catalog = Pick<UseTaxesResult, 'createTax' | 'updateTax' | 'deleteTax' | 'setDefaultTax'>

interface TaxCatalogEditorProps extends Catalog {
  taxes: TaxRate[]
  canEdit: boolean
  error: string | null
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
  const { confirm, dialog } = useConfirmDialog()

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
    const confirmed = await confirm({
      title: 'Eliminar tasa',
      message: `¿Eliminar la tasa "${tax.name}"? Los productos deben tener otra tasa asignada.`,
      confirmLabel: 'Eliminar'
    })
    if (!confirmed) return
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
        <TaxDraftForm
          draft={draft}
          assignedProductCount={taxes.find((tax) => tax.id === draft.id)?.productCount ?? 0}
          isSaving={isSaving}
          canEdit={canEdit}
          onChange={setDraft}
          onCancel={() => setDraft(null)}
          onSave={() => void handleSave()}
        />
      )}
      {dialog}
    </div>
  )
}

export default TaxCatalogEditor
