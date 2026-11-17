import React, { useState } from 'react'
import type {
  Brand,
  BrandInput,
  Supplier,
  SupplierInput,
  ProductType,
  ProductTypeInput
} from '@shared/contracts'
import {
  Check,
  Edit3,
  Plus,
  Star,
  Trash2,
  X,
  AlertCircle
} from '../../../shared/icons/Icons'

const inputClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0] disabled:bg-slate-50 disabled:text-slate-500'

interface CatalogEditorProps<T, TInput> {
  items: T[]
  canEdit: boolean
  error: string | null
  createItem: (input: TInput) => Promise<T>
  updateItem: (item: T) => Promise<T>
  deleteItem: (id: string) => Promise<void>
  setDefaultItem?: (id: string) => Promise<T>
  isDefaultable?: boolean
  itemLabel: (item: T) => string | undefined
  itemSubtitle?: (item: T) => string | undefined
  placeholderName: string
  entityName: string
  defaultBadge?: (item: T) => React.ReactNode
}

interface DraftState {
  id?: string
  name: string
  code?: string
  active: boolean
  description?: string
}

/**
 * Editor genérico de catálogo (marcas, proveedores, tipos de producto).
 * Sigue el mismo patrón de TaxCatalogEditor: lista + formulario de alta/edición.
 */
export const CatalogEditor: React.FC<CatalogEditorProps<any, any>> = ({
  items,
  canEdit,
  error,
  createItem,
  updateItem,
  deleteItem,
  setDefaultItem,
  isDefaultable = false,
  itemLabel,
  itemSubtitle,
  placeholderName,
  entityName,
  defaultBadge
}) => {
  const [draft, setDraft] = useState<DraftState | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const startCreate = (): void => {
    setFormError(null)
    setDraft({ id: undefined, name: '', code: undefined, active: true })
  }

  const startEdit = (item: any): void => {
    setFormError(null)
    setDraft({
      id: item.id,
      name: item.name,
      code: item.code ?? undefined,
      active: Boolean(item.active),
      description: item.description ?? undefined
    })
  }

  const handleSave = async (): Promise<void> => {
    if (!draft) return
    const name = draft.name.trim()
    if (!name) {
      setFormError(`Indique el nombre de ${entityName}.`)
      return
    }

    const payload: any = { name, active: draft.active }
    if (draft.code !== undefined) payload.code = draft.code

    setIsSaving(true)
    setFormError(null)
    try {
      if (draft.id) {
        const existing = items.find((i: any) => i.id === draft.id)
        if (!existing) throw new Error(`${entityName} ya no existe. Recargue la pantalla.`)
        await updateItem({ ...existing, ...payload })
      } else {
        await createItem(payload)
      }
      setDraft(null)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : `No se pudo guardar ${entityName}.`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (item: any): Promise<void> => {
    if (!canEdit) return
    if (
      !window.confirm(`¿Eliminar ${entityName} "${item.name}"?`)
    ) {
      return
    }
    setFormError(null)
    try {
      await deleteItem(item.id)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : `No se pudo eliminar ${entityName}.`)
    }
  }

  const handleSetDefault = async (item: any): Promise<void> => {
    if (!canEdit || !setDefaultItem) return
    setFormError(null)
    try {
      await setDefaultItem(item.id)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : `No se pudo cambiar la predeterminada.`)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700">
          {entityName.charAt(0).toUpperCase() + entityName.slice(1)}
        </span>
        <button
          type="button"
          disabled={!canEdit || draft !== null}
          onClick={startCreate}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#0067C0] bg-blue-50 border border-blue-200 rounded-[4px] hover:bg-blue-100 disabled:opacity-50 cursor-pointer"
        >
          <Plus size={12} />
          Nueva{' '}
          {entityName.charAt(0).toUpperCase() + entityName.slice(1)}
        </button>
      </div>

      {formError && (
        <div className="flex items-start gap-1.5 p-2 bg-red-50 border border-red-200 rounded-[4px] text-[11px] text-red-700 font-semibold">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span>{formError}</span>
        </div>
      )}
      {error && (
        <div className="flex items-start gap-1.5 p-2 bg-red-50 border border-red-200 rounded-[4px] text-[11px] text-red-700 font-semibold">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="border border-slate-200 rounded-[4px] overflow-hidden">
        <table className="w-full text-left text-[11px]">
          <thead className="bg-slate-50 text-slate-600 font-semibold">
            <tr>
              <th className="py-1.5 px-2">{entityName}</th>
              {isDefaultable && (
                <th className="py-1.5 px-2 text-center">Predet.</th>
              )}
              <th className="py-1.5 px-2 text-center">Productos</th>
              <th className="py-1.5 px-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="py-3 px-2 text-center text-slate-500">
                  No hay {entityName}s configuradas. Cree al menos una.
                </td>
              </tr>
            )}
            {items.map((item: any) => (
              <tr key={item.id} className={item.active ? '' : 'opacity-60'}>
                <td className="py-1.5 px-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800">{itemLabel(item)}</span>
                    {isDefaultable && item.isDefault && (
                      <span className="text-[9px] font-bold uppercase text-[#107C41] bg-emerald-50 border border-emerald-200 rounded-[3px] px-1">
                        Predeterminada
                      </span>
                    )}
                    {!item.active && (
                      <span className="text-[9px] font-bold uppercase text-slate-500 bg-slate-100 border border-slate-200 rounded-[3px] px-1">
                        Inactiva
                      </span>
                    )}
                  </div>
                  {itemSubtitle && <span className="text-[10px] text-slate-400">{itemSubtitle(item)}</span>}
                </td>
                {isDefaultable && (
                  <td className="py-1.5 px-2 text-center">
                    {defaultBadge ? defaultBadge(item) : item.isDefault ? 'Sí' : 'No'}
                  </td>
                )}
                <td className="py-1.5 px-2 text-center font-mono text-slate-500">
                  {item.productCount ?? 0}
                </td>
                <td className="py-1.5 px-2">
                  <div className="flex items-center justify-center gap-1">
                    {isDefaultable && !item.isDefault && (
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => void handleSetDefault(item)}
                        title="Marcar como predeterminada"
                        className="p-1 rounded text-[#717783] hover:text-[#107C41] hover:bg-emerald-50 disabled:opacity-30 cursor-pointer"
                      >
                        <Star size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => startEdit(item)}
                      title={`Editar ${entityName}`}
                      className="p-1 rounded text-[#717783] hover:text-[#0067C0] hover:bg-blue-50 disabled:opacity-30 cursor-pointer"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      type="button"
                      disabled={
                        !canEdit ||
                        (isDefaultable && item.isDefault) ||
                        (item.productCount ?? 0) > 0
                      }
                      onClick={() => void handleDelete(item)}
                      title={
                        (isDefaultable && item.isDefault)
                          ? 'Asigne otra predeterminada antes de eliminar'
                          : (item.productCount ?? 0) > 0
                            ? 'Tiene productos asignados'
                            : `Eliminar ${entityName}`
                      }
                      className="p-1 rounded text-[#717783] hover:text-[#C42B1C] hover:bg-red-50 disabled:opacity-30 cursor-pointer"
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
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                Nombre
              </label>
              <input
                type="text"
                value={draft.name}
                maxLength={64}
                disabled={!canEdit || isSaving}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder={placeholderName}
                className={inputClass}
              />
            </div>
          </div>
          {draft.code !== undefined && (
            <div className="flex items-end gap-2">
              <div className="w-24">
                <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                  Código
                </label>
                <input
                  type="text"
                  value={draft.code ?? ''}
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
            </div>
          )}
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
              {isSaving ? 'Guardando…' : draft.id ? `Guardar ${entityName}` : `Crear ${entityName}`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CatalogEditor
