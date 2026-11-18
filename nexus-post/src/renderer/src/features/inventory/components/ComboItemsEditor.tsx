import React, { useState } from 'react'
import type { ComboItem, ComboItemInput, Product } from '@shared/contracts'
import { useComboItems } from '../../../shared/hooks/useComboItems'
import { Check, Edit3, Layers, Plus, Trash2, X, AlertCircle } from '../../../shared/icons/Icons'
import ProductSearchSelect from './ProductSearchSelect'

interface ComboItemsEditorProps {
  /** ID del producto combo (solo se edita si ya existe). */
  comboId?: string
  /** Catálogo de productos para elegir componentes. */
  products: Product[]
}

const inputClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]'

interface Draft {
  id?: string
  componentId: string
  quantity: string
  active: boolean
}

/** Editor de componentes de un producto combo/bundle. */
export const ComboItemsEditor: React.FC<ComboItemsEditorProps> = ({ comboId, products }) => {
  const { items, error, createItem, updateItem, deleteItem } = useComboItems(comboId)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Componentes elegibles: productos activos que no sean combos ni el propio combo.
  const eligible = products.filter(
    (p) => p.active && !p.deleted && p.typeKind !== 'combo' && p.id !== comboId
  )

  const startCreate = (): void => {
    setFormError(null)
    setDraft({ componentId: '', quantity: '1', active: true })
  }

  const startEdit = (item: ComboItem): void => {
    setFormError(null)
    setDraft({
      id: item.id,
      componentId: item.componentId,
      quantity: String(item.quantity),
      active: item.active
    })
  }

  const handleSave = async (): Promise<void> => {
    if (!draft || !comboId) return
    if (!draft.componentId) {
      setFormError('Seleccione un producto componente.')
      return
    }
    const quantity = Number(draft.quantity)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFormError('La cantidad debe ser mayor a 0.')
      return
    }

    setIsSaving(true)
    setFormError(null)
    try {
      const payload: ComboItemInput = {
        comboId,
        componentId: draft.componentId,
        quantity,
        active: draft.active
      }
      if (draft.id) {
        await updateItem({ ...payload, id: draft.id })
      } else {
        await createItem(payload)
      }
      setDraft(null)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el componente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (item: ComboItem): Promise<void> => {
    if (!window.confirm(`¿Quitar "${item.componentName ?? item.componentId}" del combo?`)) return
    setFormError(null)
    try {
      await deleteItem(item.id)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo quitar el componente.')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
          <Layers size={13} className="text-[#0067C0]" />
          Componentes del Combo ({items.length})
        </span>
        {comboId && (
          <button
            type="button"
            disabled={draft !== null}
            onClick={startCreate}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#0067C0] bg-blue-50 border border-blue-200 rounded-[4px] hover:bg-blue-100 disabled:opacity-50 cursor-pointer"
          >
            <Plus size={12} />
            Agregar componente
          </button>
        )}
      </div>

      {!comboId && (
        <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-[4px] px-2 py-1.5">
          Guarde el producto como tipo <b>Combo / Kit</b> primero para agregar componentes.
        </p>
      )}

      {(formError || error) && (
        <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded-[4px] text-[11px] text-red-700 font-semibold">
          <AlertCircle size={13} className="shrink-0" />
          <span>{formError ?? error}</span>
        </div>
      )}

      {items.length > 0 && (
        <div className="border border-slate-200 rounded-[4px] overflow-hidden">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="py-1 px-2">Componente</th>
                <th className="py-1 px-2 text-right">Cant./Combo</th>
                <th className="py-1 px-2 text-center">Activo</th>
                <th className="py-1 px-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className={!item.active ? 'opacity-60' : ''}>
                  <td className="py-1 px-2">{item.componentName ?? item.componentId}</td>
                  <td className="py-1 px-2 text-right font-mono">{item.quantity}</td>
                  <td className="py-1 px-2 text-center">{item.active ? 'Sí' : 'No'}</td>
                  <td className="py-1 px-2">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        title="Editar componente"
                        className="p-1 rounded text-[#717783] hover:text-[#0067C0] hover:bg-blue-50 cursor-pointer"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(item)}
                        title="Quitar componente"
                        className="p-1 rounded text-[#717783] hover:text-[#C42B1C] hover:bg-red-50 cursor-pointer"
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
      )}

      {draft && (
        <div className="p-2.5 border border-[#0067C0]/40 bg-blue-50/40 rounded-[4px] space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                Producto componente
              </label>
              <ProductSearchSelect
                products={eligible}
                value={draft.componentId}
                onChange={(componentId) => setDraft({ ...draft, componentId })}
                label="Producto componente"
                className={inputClass}
                placeholder="Buscar por código o nombre..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                Cantidad por combo
              </label>
              <input
                type="number"
                min="0.001"
                step="0.001"
                value={draft.quantity}
                onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 pb-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={draft.active}
                  onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                  className="rounded border-slate-300 text-[#0067C0]"
                />
                Activo
              </label>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-700 bg-white border border-slate-300 rounded-[4px] hover:bg-slate-50 cursor-pointer"
            >
              <X size={12} />
              Cancelar
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => void handleSave()}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] rounded-[4px] disabled:opacity-50 cursor-pointer"
            >
              <Check size={12} />
              {isSaving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComboItemsEditor
