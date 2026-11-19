import React, { useState } from 'react'
import { Edit3, Plus, Trash2, AlertCircle } from '../../../shared/icons/Icons'
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog'
import { CatalogDraftForm, type CatalogDraft } from './CatalogDraftForm'

interface CatalogEntity {
  id: string
  name: string
  active: boolean
  productCount?: number
}

interface CatalogEditorProps<T extends CatalogEntity> {
  items: T[]
  canEdit: boolean
  error: string | null
  createItem: (input: Pick<CatalogEntity, 'name' | 'active'>) => Promise<T>
  updateItem: (item: T) => Promise<T>
  deleteItem: (id: string) => Promise<void>
  itemLabel: (item: T) => string | undefined
  itemSubtitle?: (item: T) => string | undefined
  placeholderName: string
  entityName: string
}

/**
 * Editor genérico de catálogo (marcas, proveedores, tipos de producto).
 * Sigue el mismo patrón de TaxCatalogEditor: lista + formulario de alta/edición.
 */
export function CatalogEditor<T extends CatalogEntity>({
  items,
  canEdit,
  error,
  createItem,
  updateItem,
  deleteItem,
  itemLabel,
  itemSubtitle,
  placeholderName,
  entityName
}: CatalogEditorProps<T>): React.JSX.Element {
  const [draft, setDraft] = useState<CatalogDraft | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const { confirm, dialog } = useConfirmDialog()

  const startCreate = (): void => {
    setFormError(null)
    setDraft({ name: '', active: true })
  }

  const startEdit = (item: T): void => {
    setFormError(null)
    setDraft({
      id: item.id,
      name: item.name,
      active: item.active
    })
  }

  const handleSave = async (): Promise<void> => {
    if (!draft) return
    const name = draft.name.trim()
    if (!name) {
      setFormError(`Indique el nombre de ${entityName}.`)
      return
    }

    setIsSaving(true)
    setFormError(null)
    try {
      if (draft.id) {
        const existing = items.find((item) => item.id === draft.id)
        if (!existing) throw new Error(`${entityName} ya no existe. Recargue la pantalla.`)
        await updateItem({ ...existing, name, active: draft.active })
      } else {
        await createItem({ name, active: draft.active })
      }
      setDraft(null)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : `No se pudo guardar ${entityName}.`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (item: T): Promise<void> => {
    if (!canEdit) return
    const confirmed = await confirm({
      title: `Eliminar ${entityName}`,
      message: `¿Eliminar ${entityName} "${item.name}"?`,
      confirmLabel: 'Eliminar'
    })
    if (!confirmed) return
    setFormError(null)
    try {
      await deleteItem(item.id)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : `No se pudo eliminar ${entityName}.`)
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
          Nueva {entityName.charAt(0).toUpperCase() + entityName.slice(1)}
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
              <th className="py-1.5 px-2 text-center">Productos</th>
              <th className="py-1.5 px-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 && (
              <tr>
                <td colSpan={3} className="py-3 px-2 text-center text-slate-500">
                  No hay {entityName}s configuradas. Cree al menos una.
                </td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className={item.active ? '' : 'opacity-60'}>
                <td className="py-1.5 px-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-800">{itemLabel(item)}</span>
                    {!item.active && (
                      <span className="text-[9px] font-bold uppercase text-slate-500 bg-slate-100 border border-slate-200 rounded-[3px] px-1">
                        Inactiva
                      </span>
                    )}
                  </div>
                  {itemSubtitle && (
                    <span className="text-[10px] text-slate-400">{itemSubtitle(item)}</span>
                  )}
                </td>
                <td className="py-1.5 px-2 text-center font-mono text-slate-500">
                  {item.productCount ?? '—'}
                </td>
                <td className="py-1.5 px-2">
                  <div className="flex items-center justify-center gap-1">
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
                        !canEdit || (item.productCount ?? 0) > 0
                      }
                      onClick={() => void handleDelete(item)}
                      title={
                        (item.productCount ?? 0) > 0
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
        <CatalogDraftForm
          draft={draft}
          entityName={entityName}
          placeholderName={placeholderName}
          canEdit={canEdit}
          isSaving={isSaving}
          onChange={setDraft}
          onCancel={() => setDraft(null)}
          onSave={() => void handleSave()}
        />
      )}
      {dialog}
    </div>
  )
}

export default CatalogEditor
