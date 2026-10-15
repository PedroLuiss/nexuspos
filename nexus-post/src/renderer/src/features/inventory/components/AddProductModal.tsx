import React from 'react'
import type { Product, ProductInput } from '@shared/contracts'
import { Package, X, Check } from '../../../shared/icons/Icons'
import ProductBasicFields from './ProductBasicFields'
import ProductPricingFields from './ProductPricingFields'
import { useProductForm, PRODUCT_UNITS } from '../hooks/useProductForm'

interface AddProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (input: ProductInput) => void
  initialProduct?: Product | null
  categories?: string[]
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialProduct,
  categories = []
}) => {
  const { values, update, generateCode, marginDollar, marginPercent, toInput } =
    useProductForm(initialProduct, categories)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!values.name.trim() || !values.code.trim() || values.salePrice <= 0) return
    onSubmit(toInput())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
      <div
        className="w-full max-w-3xl bg-white rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] select-none">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-[4px] bg-[#0067C0]/10 text-[#0067C0]">
              <Package size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#1B1B1B] tracking-tight">
                {initialProduct ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </h2>
              <p className="text-[11px] text-[#717783]">
                Ingresa los datos para registrar el artículo en el catálogo de inventario
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

        <form onSubmit={handleSubmit}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
            <ProductBasicFields
              values={values}
              update={update}
              categories={categories}
              units={PRODUCT_UNITS}
              onGenerateCode={generateCode}
            />
            <ProductPricingFields
              values={values}
              update={update}
              marginDollar={marginDollar}
              marginPercent={marginPercent}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 px-5 py-2.5 bg-[#F9F9F9] border-t border-[#E5E5E5] rounded-b-[8px]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px] hover:bg-[#F9F9F9] cursor-pointer"
            >
              Cancelar [ESC]
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-1.5 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] active:bg-[#004f96] rounded-[4px] shadow-xs transition-colors cursor-pointer"
            >
              <Check size={14} />
              <span>{initialProduct ? 'Guardar Cambios' : 'Registrar Producto'}</span>
              <span className="kbd-badge bg-white/20 text-white border-white/30 text-[10px]">
                ENTER
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddProductModal
