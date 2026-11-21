import React, { useState } from 'react'
import type { Category, CategoryInput } from '@shared/contracts'

interface CategoryFormProps {
  initialCategory: Category | null
  onSubmit: (input: CategoryInput, id?: string) => void
  onCancel: () => void
}

/** Formulario de alta/edición de una categoría (nombre + descripción + estado). */
export const CategoryForm: React.FC<CategoryFormProps> = ({
  initialCategory,
  onSubmit,
  onCancel
}) => {
  const [name, setName] = useState(initialCategory?.name ?? '')
  const [description, setDescription] = useState(initialCategory?.description ?? '')
  const [active, setActive] = useState(initialCategory?.active ?? true)

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!name.trim()) return

    const input: CategoryInput = {
      name: name.trim(),
      description: description.trim(),
      active,
      deleted: false
    }
    onSubmit(input, initialCategory?.id)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-3 border-t border-slate-100">
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Nombre de la Categoría <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          placeholder="Ej. Bebidas y Refrescos"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4]"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Descripción (Opcional)
        </label>
        <textarea
          rows={2}
          placeholder="Detalle breve del tipo de productos que agrupa..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-sm focus:border-[#0078D4] focus:ring-1 focus:ring-[#0078D4] resize-none"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="w-4 h-4 rounded accent-[#0067C0]"
        />
        <span className="text-xs text-slate-700 font-medium">Activa (visible para productos)</span>
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px] hover:bg-[#F9F9F9] cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-5 py-1.5 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] active:bg-[#004f96] rounded-[4px] shadow-xs transition-colors cursor-pointer"
        >
          {initialCategory ? 'Guardar Cambios' : 'Crear Categoría'}
        </button>
      </div>
    </form>
  )
}

export default CategoryForm
