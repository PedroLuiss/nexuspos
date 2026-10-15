import React, { useEffect, useRef, useState } from 'react'
import type { Category, CategoryInput } from '@shared/contracts'
import { Tags, X, Plus } from '../../../shared/icons/Icons'
import type { UseCategoriesResult } from '../hooks/useCategories'
import { toErrorMessage } from '../api/products.api'
import CategoryTable from './CategoryTable'
import CategoryForm from './CategoryForm'

interface CategoryManagerModalProps {
  isOpen: boolean
  onClose: () => void
  manager: UseCategoriesResult
}

/** Modal de gestión de categorías: listado, alta, edición, baja y activación. */
export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  manager
}) => {
  const { categories, error, createCategory, updateCategory, deleteCategory, toggleStatus } =
    manager

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const notifyError = (err: unknown): void => {
    if (mounted.current) window.alert(toErrorMessage(err))
  }

  const handleSubmit = async (input: CategoryInput, id?: string): Promise<void> => {
    try {
      if (id) {
        const existing = categories.find((c) => c.id === id)
        if (existing) await updateCategory({ ...existing, ...input, id })
      } else {
        await createCategory(input)
      }
      setShowForm(false)
      setEditing(null)
    } catch (err) {
      notifyError(err)
    }
  }

  const handleDelete = async (category: Category): Promise<void> => {
    if (!window.confirm(`¿Eliminar la categoría "${category.name}"?`)) return
    try {
      await deleteCategory(category.id)
    } catch (err) {
      notifyError(err)
    }
  }

  const handleToggleStatus = async (id: string): Promise<void> => {
    try {
      await toggleStatus(id)
    } catch (err) {
      notifyError(err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
      <div
        className="w-full max-w-2xl bg-white rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] select-none">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-[4px] bg-[#0067C0]/10 text-[#0067C0]">
              <Tags size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#1B1B1B] tracking-tight">
                Gestión de Categorías
              </h2>
              <p className="text-[11px] text-[#717783]">
                Administra el catálogo de categorías usado en el inventario
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="kbd-badge">ESC</span>
            <button
              onClick={onClose}
              title="Cerrar (Esc)"
              className="p-1 text-[#717783] hover:text-[#C42B1C] hover:bg-[#F3F3F3] rounded transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="px-3 py-2 text-xs font-semibold text-[#C42B1C] bg-red-50 border border-red-200 rounded-[4px]">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-xs text-[#717783] font-medium">
              {categories.length} categoría{categories.length === 1 ? '' : 's'}
            </span>
            <button
              onClick={() => {
                setEditing(null)
                setShowForm((v) => !v)
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] active:bg-[#004f96] rounded-[4px] shadow-xs transition-colors cursor-pointer"
            >
              <Plus size={15} />
              <span>{showForm ? 'Ocultar Formulario' : 'Nueva Categoría'}</span>
            </button>
          </div>

          {showForm && (
            <CategoryForm
              key={editing?.id ?? 'new'}
              initialCategory={editing}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false)
                setEditing(null)
              }}
            />
          )}

          <CategoryTable
            categories={categories}
            onEdit={(cat) => {
              setEditing(cat)
              setShowForm(true)
            }}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
          />
        </div>
      </div>
    </div>
  )
}

export default CategoryManagerModal
