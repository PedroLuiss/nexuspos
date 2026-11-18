import React, { useState } from 'react'
import type { ProductBatch, ProductBatchInput } from '@shared/contracts'
import { useProductBatches, daysToExpiry, isBatchExpired } from '../../../shared/hooks/useProductBatches'
import { Check, Edit3, Plus, Trash2, X, AlertCircle, CalendarClock } from '../../../shared/icons/Icons'

interface BatchEditorProps {
  productId?: string
  productName: string
  trackBatches: boolean
  onEnableTracking: () => void
}

const inputClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]'

interface Draft {
  id?: string
  batchNumber: string
  quantity: string
  expirationDate: string
}

function expiryBadge(batch: ProductBatch): React.ReactNode {
  if (isBatchExpired(batch)) {
    return (
      <span className="inline-block text-[9px] font-bold text-[#C42B1C] bg-red-50 border border-red-200 rounded-[3px] px-1">
        VENCIDO
      </span>
    )
  }
  const days = daysToExpiry(batch)
  if (days === null) {
    return <span className="text-[9px] text-slate-400">Sin vencimiento</span>
  }
  if (days <= 7) {
    return (
      <span className="inline-block text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-[3px] px-1">
        Vence en {days}d
      </span>
    )
  }
  return <span className="text-[9px] text-slate-500">Vence {batch.expirationDate}</span>
}

/** Editor de lotes y caducidad de un producto. */
export const BatchEditor: React.FC<BatchEditorProps> = ({
  productId,
  productName,
  trackBatches,
  onEnableTracking
}) => {
  const { batches, error, receive, update, softDelete, totalStock } = useProductBatches(productId)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const startCreate = (): void => {
    setFormError(null)
    setDraft({ batchNumber: `LOTE-${new Date().toISOString().slice(0, 10)}`, quantity: '0', expirationDate: '' })
  }

  const startEdit = (batch: ProductBatch): void => {
    setFormError(null)
    setDraft({
      id: batch.id,
      batchNumber: batch.batchNumber,
      quantity: String(batch.quantity),
      expirationDate: batch.expirationDate ?? ''
    })
  }

  const handleSave = async (): Promise<void> => {
    if (!draft || !productId) return
    const quantity = Number(draft.quantity)
    if (!draft.batchNumber.trim()) {
      setFormError('El número de lote es obligatorio.')
      return
    }
    if (!Number.isFinite(quantity) || quantity < 0) {
      setFormError('La cantidad debe ser mayor o igual a 0.')
      return
    }

    setIsSaving(true)
    setFormError(null)
    try {
      if (draft.id) {
        const existing = batches.find((b) => b.id === draft.id)
        if (existing) {
          await update({
            ...existing,
            batchNumber: draft.batchNumber.trim(),
            quantity,
            expirationDate: draft.expirationDate || undefined
          })
        }
      } else {
        const input: ProductBatchInput = {
          productId,
          batchNumber: draft.batchNumber.trim(),
          quantity,
          expirationDate: draft.expirationDate || undefined,
          active: true
        }
        await receive(input)
      }
      setDraft(null)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el lote.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (batch: ProductBatch): Promise<void> => {
    if (!window.confirm(`¿Eliminar el lote "${batch.batchNumber}"?`)) return
    setFormError(null)
    try {
      await softDelete(batch.id)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo eliminar el lote.')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
          <CalendarClock size={13} className="text-[#0067C0]" />
          Lotes y Caducidad {trackBatches && `(${batches.length} · ${totalStock} und)`}
        </span>
        {trackBatches && productId && (
          <button
            type="button"
            disabled={draft !== null}
            onClick={startCreate}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#0067C0] bg-blue-50 border border-blue-200 rounded-[4px] hover:bg-blue-100 disabled:opacity-50 cursor-pointer"
          >
            <Plus size={12} />
            Entrada de lote
          </button>
        )}
      </div>

      {!trackBatches && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded-[4px] flex items-center justify-between gap-2">
          <span className="text-[10px] text-amber-800">
            Este producto no controla lotes. Active la casilla y guarde el producto para registrar
            vencimientos y salidas FEFO.
          </span>
          {productId && (
            <button
              type="button"
              onClick={onEnableTracking}
              className="px-2 py-1 text-[10px] font-bold text-white bg-[#0067C0] rounded-[4px] cursor-pointer shrink-0"
            >
              Activar
            </button>
          )}
        </div>
      )}

      {(formError || error) && (
        <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded-[4px] text-[11px] text-red-700 font-semibold">
          <AlertCircle size={13} className="shrink-0" />
          <span>{formError ?? error}</span>
        </div>
      )}

      {trackBatches && batches.length === 0 && (
        <p className="text-[10px] text-slate-500">
          No hay lotes registrados para "{productName}". Agregue una entrada de lote.
        </p>
      )}

      {batches.length > 0 && (
        <div className="border border-slate-200 rounded-[4px] overflow-hidden">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-slate-50 text-slate-600 font-semibold">
              <tr>
                <th className="py-1 px-2">Lote</th>
                <th className="py-1 px-2 text-right">Cant.</th>
                <th className="py-1 px-2 text-center">Vencimiento</th>
                <th className="py-1 px-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {batches.map((batch) => (
                <tr key={batch.id}>
                  <td className="py-1 px-2 font-mono">{batch.batchNumber}</td>
                  <td className="py-1 px-2 text-right font-mono">{batch.quantity}</td>
                  <td className="py-1 px-2 text-center">{expiryBadge(batch)}</td>
                  <td className="py-1 px-2">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(batch)}
                        className="p-1 rounded text-[#717783] hover:text-[#0067C0] hover:bg-blue-50 cursor-pointer"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(batch)}
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
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Nº Lote</label>
              <input
                type="text"
                value={draft.batchNumber}
                onChange={(e) => setDraft({ ...draft, batchNumber: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">Cantidad</label>
              <input
                type="number"
                step="0.001"
                value={draft.quantity}
                onChange={(e) => setDraft({ ...draft, quantity: e.target.value })}
                className={`${inputClass} font-mono`}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                Vencimiento (opcional)
              </label>
              <input
                type="date"
                value={draft.expirationDate}
                onChange={(e) => setDraft({ ...draft, expirationDate: e.target.value })}
                className={inputClass}
              />
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

export default BatchEditor
