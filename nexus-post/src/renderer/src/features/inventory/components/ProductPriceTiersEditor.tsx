import React, { useState } from 'react'
import type { ProductPriceTier, ProductPriceTierInput } from '@shared/contracts'
import { useProductPriceTiers } from '../../../shared/hooks/useProductPriceTiers'
import { Check, Edit3, Plus, Trash2, X, AlertCircle, Layers } from '../../../shared/icons/Icons'
import { useTablePagination } from '../hooks/useTablePagination'
import { useConfirmDialog } from '../../../shared/hooks/useConfirmDialog'
import { CurrencyInput } from '../../../shared/ui/CurrencyInput'
import TablePagination from './TablePagination'

interface ProductPriceTiersEditorProps {
  /** ID del producto (solo se edita si ya existe). */
  productId?: string
  /** Precio de venta estándar del producto (para sugerir en el formulario). */
  salePrice: number
}

const inputClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]'

interface Draft {
  id?: string
  minQuantity: string
  maxQuantity: string
  price: string
  active: boolean
}

/** Editor de escalas de precios por mayoreo (tiers) de un producto. */
export const ProductPriceTiersEditor: React.FC<ProductPriceTiersEditorProps> = ({
  productId,
  salePrice
}) => {
  const { tiers, error, createTier, updateTier, deleteTier } = useProductPriceTiers(productId)
  const pagination = useTablePagination(tiers)
  const confirmation = useConfirmDialog()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const startCreate = (): void => {
    setFormError(null)
    setDraft({
      minQuantity: '',
      maxQuantity: '',
      price: (salePrice * 0.9).toFixed(2),
      active: true
    })
  }

  const startEdit = (tier: ProductPriceTier): void => {
    setFormError(null)
    setDraft({
      id: tier.id,
      minQuantity: String(tier.minQuantity),
      maxQuantity: tier.maxQuantity !== undefined ? String(tier.maxQuantity) : '',
      price: tier.price.toFixed(2),
      active: tier.active
    })
  }

  const handleSave = async (): Promise<void> => {
    if (!draft || !productId) return
    const minQuantity = Number(draft.minQuantity)
    const maxQuantity = draft.maxQuantity.trim() ? Number(draft.maxQuantity) : undefined
    const price = Number(draft.price)

    if (!Number.isFinite(minQuantity) || minQuantity < 0) {
      setFormError('La cantidad mínima debe ser un número válido.')
      return
    }
    if (maxQuantity !== undefined && (!Number.isFinite(maxQuantity) || maxQuantity < minQuantity)) {
      setFormError('La cantidad máxima debe ser mayor o igual a la mínima.')
      return
    }
    if (!Number.isFinite(price) || price <= 0) {
      setFormError('El precio debe ser mayor a 0.')
      return
    }

    setIsSaving(true)
    setFormError(null)
    try {
      const payload: ProductPriceTierInput = {
        productId,
        minQuantity,
        maxQuantity,
        price,
        active: draft.active
      }
      if (draft.id) {
        await updateTier({ ...payload, id: draft.id })
      } else {
        await createTier(payload)
      }
      setDraft(null)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el precio.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (tier: ProductPriceTier): Promise<void> => {
    const confirmed = await confirmation.confirm({
      title: 'Eliminar escala de precio',
      message: `¿Eliminar el tier ${tier.minQuantity}-${tier.maxQuantity ?? '∞'}?`,
      confirmLabel: 'Eliminar'
    })
    if (!confirmed) return
    setFormError(null)
    try {
      await deleteTier(tier.id)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo eliminar el precio.')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
          <Layers size={13} className="text-[#0067C0]" />
          Precios por Mayoreo ({tiers.length})
        </span>
        {productId && (
          <button
            type="button"
            disabled={draft !== null}
            onClick={startCreate}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#0067C0] bg-blue-50 border border-blue-200 rounded-[4px] hover:bg-blue-100 disabled:opacity-50 cursor-pointer"
          >
            <Plus size={12} />
            Agregar escala
          </button>
        )}
      </div>

      {!productId && (
        <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-[4px] px-2 py-1.5">
          Guarde el producto primero para poder agregar escalas de precios.
        </p>
      )}

      {(formError || error) && (
        <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded-[4px] text-[11px] text-red-700 font-semibold">
          <AlertCircle size={13} className="shrink-0" />
          <span>{formError ?? error}</span>
        </div>
      )}

      {tiers.length > 0 && (
        <div className="border border-slate-200 rounded-[4px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="py-1 px-2 text-right">Desde</th>
                  <th className="py-1 px-2 text-right">Hasta</th>
                  <th className="py-1 px-2 text-right">Precio</th>
                  <th className="py-1 px-2 text-center">Activo</th>
                  <th className="py-1 px-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagination.items.map((tier) => (
                  <tr key={tier.id} className={!tier.active ? 'opacity-60' : ''}>
                    <td className="py-1 px-2 text-right font-mono">{tier.minQuantity}</td>
                    <td className="py-1 px-2 text-right font-mono">{tier.maxQuantity ?? '∞'}</td>
                    <td className="py-1 px-2 text-right font-mono font-bold text-[#107C41]">
                      ${tier.price.toFixed(2)}
                    </td>
                    <td className="py-1 px-2 text-center">{tier.active ? 'Sí' : 'No'}</td>
                    <td className="py-1 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(tier)}
                          title="Editar escala"
                          className="p-1 rounded text-[#717783] hover:text-[#0067C0] hover:bg-blue-50 cursor-pointer"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(tier)}
                          title="Eliminar escala"
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
          <TablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setPage}
          />
        </div>
      )}

      {draft && (
        <div className="p-2.5 border border-[#0067C0]/40 bg-blue-50/40 rounded-[4px] space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                Desde (cant.)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.minQuantity}
                onChange={(e) => setDraft({ ...draft, minQuantity: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                Hasta (blank=∞)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draft.maxQuantity}
                onChange={(e) => setDraft({ ...draft, maxQuantity: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                Precio ($)
              </label>
              <CurrencyInput
                min="0"
                value={Number(draft.price) || 0}
                onValueChange={(price) => setDraft({ ...draft, price: price.toFixed(2) })}
                className={`${inputClass} font-mono`}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.active}
                onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                className="rounded border-slate-300 text-[#0067C0]"
              />
              Activo
            </label>
            <div className="ml-auto flex items-center gap-1.5">
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
        </div>
      )}
      {confirmation.dialog}
    </div>
  )
}

export default ProductPriceTiersEditor
