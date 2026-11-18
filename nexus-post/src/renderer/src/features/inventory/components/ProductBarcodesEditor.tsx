import React, { useState } from 'react'
import type { ProductBarcode, ProductBarcodeInput } from '@shared/contracts'
import { useProductBarcodes } from '../../../shared/hooks/useProductBarcodes'
import {
  Barcode,
  Check,
  Edit3,
  Plus,
  Star,
  Trash2,
  X,
  AlertCircle
} from '../../../shared/icons/Icons'
import { useTablePagination } from '../hooks/useTablePagination'
import TablePagination from './TablePagination'

interface ProductBarcodesEditorProps {
  /** ID del producto (solo se edita si ya existe). */
  productId?: string
}

const FORMATS = ['EAN-13', 'EAN-8', 'UPC-A', 'Code128', 'Code39', 'ITF-14', 'OTRO']
const inputClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]'

interface Draft {
  id?: string
  barcode: string
  format: string
  label: string
  isPrimary: boolean
  active: boolean
}

/** Editor de códigos de barras múltiples de un producto. */
export const ProductBarcodesEditor: React.FC<ProductBarcodesEditorProps> = ({ productId }) => {
  const { barcodes, error, createBarcode, updateBarcode, deleteBarcode } =
    useProductBarcodes(productId)
  const pagination = useTablePagination(barcodes)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const startCreate = (): void => {
    setFormError(null)
    setDraft({
      barcode: '',
      format: 'EAN-13',
      label: '',
      isPrimary: barcodes.length === 0,
      active: true
    })
  }

  const startEdit = (barcode: ProductBarcode): void => {
    setFormError(null)
    setDraft({
      id: barcode.id,
      barcode: barcode.barcode,
      format: barcode.format,
      label: barcode.label ?? '',
      isPrimary: barcode.isPrimary,
      active: barcode.active
    })
  }

  const handleSave = async (): Promise<void> => {
    if (!draft || !productId) return
    if (!draft.barcode.trim()) {
      setFormError('Ingrese el código de barras.')
      return
    }
    setIsSaving(true)
    setFormError(null)
    try {
      const payload: ProductBarcodeInput = {
        productId,
        barcode: draft.barcode.trim(),
        format: draft.format as ProductBarcodeInput['format'],
        label: draft.label.trim() || undefined,
        isPrimary: draft.isPrimary,
        active: draft.active
      }
      if (draft.id) {
        await updateBarcode({ ...payload, id: draft.id })
      } else {
        await createBarcode(payload)
      }
      setDraft(null)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar el código.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (barcode: ProductBarcode): Promise<void> => {
    if (!window.confirm(`¿Eliminar el código "${barcode.barcode}"?`)) return
    setFormError(null)
    try {
      await deleteBarcode(barcode.id)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo eliminar el código.')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
          <Barcode size={13} className="text-[#0067C0]" />
          Códigos de Barras ({barcodes.length})
        </span>
        {productId && (
          <button
            type="button"
            disabled={draft !== null}
            onClick={startCreate}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#0067C0] bg-blue-50 border border-blue-200 rounded-[4px] hover:bg-blue-100 disabled:opacity-50 cursor-pointer"
          >
            <Plus size={12} />
            Agregar código
          </button>
        )}
      </div>

      {!productId && (
        <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-[4px] px-2 py-1.5">
          Guarde el producto primero para poder agregar códigos de barras.
        </p>
      )}

      {(formError || error) && (
        <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded-[4px] text-[11px] text-red-700 font-semibold">
          <AlertCircle size={13} className="shrink-0" />
          <span>{formError ?? error}</span>
        </div>
      )}

      {barcodes.length > 0 && (
        <div className="border border-slate-200 rounded-[4px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="py-1 px-2">Código</th>
                  <th className="py-1 px-2">Formato</th>
                  <th className="py-1 px-2">Etiqueta</th>
                  <th className="py-1 px-2 text-center">Principal</th>
                  <th className="py-1 px-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagination.items.map((barcode) => (
                  <tr key={barcode.id}>
                    <td className="py-1 px-2 font-mono">{barcode.barcode}</td>
                    <td className="py-1 px-2">{barcode.format}</td>
                    <td className="py-1 px-2 text-slate-500">{barcode.label ?? '-'}</td>
                    <td className="py-1 px-2 text-center">
                      {barcode.isPrimary ? (
                        <Star size={13} className="inline text-amber-500 fill-amber-500" />
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-1 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(barcode)}
                          title="Editar código"
                          className="p-1 rounded text-[#717783] hover:text-[#0067C0] hover:bg-blue-50 cursor-pointer"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(barcode)}
                          title="Eliminar código"
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
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                Código de barras
              </label>
              <input
                type="text"
                value={draft.barcode}
                onChange={(e) => setDraft({ ...draft, barcode: e.target.value })}
                placeholder="Ej. 7501000000015"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                Formato
              </label>
              <select
                value={draft.format}
                onChange={(e) => setDraft({ ...draft, format: e.target.value })}
                className={inputClass}
              >
                {FORMATS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
                Etiqueta
              </label>
              <input
                type="text"
                value={draft.label}
                maxLength={64}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                placeholder="Ej. Caja x 12"
                className={inputClass}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.isPrimary}
                onChange={(e) => setDraft({ ...draft, isPrimary: e.target.checked })}
                className="rounded border-slate-300 text-[#0067C0]"
              />
              Código principal
            </label>
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
    </div>
  )
}

export default ProductBarcodesEditor
