import React, { useState } from 'react'
import type { Product, ProductInput } from '@shared/contracts'
import { useProductVariants } from '../../../shared/hooks/useProductVariants'
import {
  formatProductAttributes,
  parseProductAttributes,
  serializeProductAttributes
} from '@shared/lib/product-variants'
import { Edit3, GitBranch, Plus, Trash2, AlertCircle } from '../../../shared/icons/Icons'
import VariantForm, { type VariantDraft } from './VariantForm'
import { useTablePagination } from '../hooks/useTablePagination'
import TablePagination from './TablePagination'

interface VariantEditorProps {
  parent: Product
  variantAttrs: string
  onVariantAttrsChange: (json: string) => void
}

const inputClass =
  'w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-[4px] focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0]'

/** Editor de variantes (talla/color) de un producto padre. */
export const VariantEditor: React.FC<VariantEditorProps> = ({
  parent,
  variantAttrs,
  onVariantAttrsChange
}) => {
  const { variants, error, createVariant, updateVariant, deleteVariant } = useProductVariants(
    parent.id
  )
  const pagination = useTablePagination(variants)
  const [attrText, setAttrText] = useState(() =>
    parseProductAttributes(variantAttrs)
      .map((a) => a.name)
      .join(', ')
  )
  const [draft, setDraft] = useState<VariantDraft | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const attributeNames = attrText
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const commitAttributeNames = (): void => {
    onVariantAttrsChange(
      serializeProductAttributes(attributeNames.map((name) => ({ name, value: '' })))
    )
  }

  const startCreate = (): void => {
    setFormError(null)
    if (attributeNames.length === 0) {
      setFormError('Defina al menos un atributo (ej. Talla, Color).')
      return
    }
    const values: Record<string, string> = {}
    attributeNames.forEach((n) => (values[n] = ''))
    setDraft({
      name: '',
      code: '',
      costPrice: String(parent.costPrice),
      salePrice: String(parent.salePrice),
      stock: '0',
      values
    })
  }

  const startEdit = (variant: Product): void => {
    setFormError(null)
    const attrs = parseProductAttributes(variant.attributes)
    const values: Record<string, string> = {}
    attributeNames.forEach((n) => (values[n] = attrs.find((a) => a.name === n)?.value ?? ''))
    setDraft({
      id: variant.id,
      name: variant.name,
      code: variant.code,
      costPrice: String(variant.costPrice),
      salePrice: String(variant.salePrice),
      stock: String(variant.stock),
      values
    })
  }

  const handleSave = async (): Promise<void> => {
    if (!draft) return
    const code = draft.code.trim()
    const name = draft.name.trim()
    const salePrice = Number(draft.salePrice)
    if (!code || !name) {
      setFormError('SKU y nombre son obligatorios.')
      return
    }
    if (!(salePrice > 0)) {
      setFormError('El precio de venta debe ser mayor a 0.')
      return
    }
    if (attributeNames.some((n) => !draft.values[n]?.trim())) {
      setFormError('Complete el valor de todos los atributos.')
      return
    }

    const base: ProductInput = {
      code,
      name,
      category: parent.category,
      unit: parent.unit,
      costPrice: Number(draft.costPrice),
      salePrice,
      stock: Number(draft.stock),
      minStock: parent.minStock,
      active: true,
      parentId: parent.id,
      attributes: serializeProductAttributes(
        attributeNames.map((n) => ({ name: n, value: draft.values[n].trim() }))
      ),
      taxId: parent.taxId,
      brandId: parent.brandId,
      supplierId: parent.supplierId,
      typeId: parent.typeId,
      description: parent.description,
      imageUrl: parent.imageUrl
    }

    setIsSaving(true)
    setFormError(null)
    try {
      if (draft.id) {
        const existing = variants.find((v) => v.id === draft.id)
        if (existing)
          await updateVariant({ ...base, id: existing.id, createdAt: existing.createdAt })
      } else {
        await createVariant(base)
      }
      setDraft(null)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo guardar la variante.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (variant: Product): Promise<void> => {
    if (!window.confirm(`¿Eliminar la variante "${variant.name}"?`)) return
    setFormError(null)
    try {
      await deleteVariant(variant.id)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'No se pudo eliminar la variante.')
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-extrabold uppercase tracking-wide text-slate-700 flex items-center gap-1.5">
          <GitBranch size={13} className="text-[#0067C0]" />
          Variantes ({variants.length})
        </span>
        <button
          type="button"
          disabled={draft !== null || attributeNames.length === 0}
          onClick={startCreate}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-bold text-[#0067C0] bg-blue-50 border border-blue-200 rounded-[4px] hover:bg-blue-100 disabled:opacity-50 cursor-pointer"
        >
          <Plus size={12} />
          Nueva variante
        </button>
      </div>

      <div className="p-2 bg-slate-50 border border-slate-200 rounded-[4px]">
        <label className="block text-[10px] font-semibold text-slate-700 mb-0.5">
          Atributos que definen las variantes (separados por coma)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={attrText}
            onChange={(e) => setAttrText(e.target.value)}
            onBlur={commitAttributeNames}
            placeholder="Ej. Talla, Color"
            className={inputClass}
          />
          <button
            type="button"
            onClick={commitAttributeNames}
            className="px-2.5 py-1.5 text-[10px] font-bold text-white bg-[#0067C0] rounded-[4px] cursor-pointer shrink-0"
          >
            Aplicar
          </button>
        </div>
        <p className="mt-1 text-[9px] text-slate-400">
          Ej: &quot;Talla, Color&quot; genera combinaciones como Talla M / Color Rojo.
        </p>
      </div>

      {formError && (
        <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded-[4px] text-[11px] text-red-700 font-semibold">
          <AlertCircle size={13} className="shrink-0" />
          <span>{formError}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-1.5 p-2 bg-red-50 border border-red-200 rounded-[4px] text-[11px] text-red-700 font-semibold">
          <AlertCircle size={13} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {variants.length > 0 && (
        <div className="border border-slate-200 rounded-[4px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 text-slate-600 font-semibold">
                <tr>
                  <th className="py-1 px-2">Variante</th>
                  <th className="py-1 px-2 text-right">Precio</th>
                  <th className="py-1 px-2 text-right">Stock</th>
                  <th className="py-1 px-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pagination.items.map((variant) => (
                  <tr key={variant.id}>
                    <td className="py-1 px-2">
                      <div className="font-medium">{variant.name}</div>
                      <div className="text-[9px] text-slate-400">
                        {formatProductAttributes(parseProductAttributes(variant.attributes))}
                      </div>
                    </td>
                    <td className="py-1 px-2 text-right font-mono text-[#107C41]">
                      ${variant.salePrice.toFixed(2)}
                    </td>
                    <td className="py-1 px-2 text-right font-mono">{variant.stock}</td>
                    <td className="py-1 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(variant)}
                          className="p-1 rounded text-[#717783] hover:text-[#0067C0] hover:bg-blue-50 cursor-pointer"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(variant)}
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
        <VariantForm
          draft={draft}
          parent={parent}
          attributeNames={attributeNames}
          isSaving={isSaving}
          error={formError}
          onChange={setDraft}
          onSave={() => void handleSave()}
          onCancel={() => setDraft(null)}
        />
      )}
    </div>
  )
}

export default VariantEditor
