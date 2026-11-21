import React from 'react'
import type { Product, ProductInput, User } from '@shared/contracts'
import { Package, X, Check } from '../../../shared/icons/Icons'
import ProductBasicFields from './ProductBasicFields'
import ProductPricingFields from './ProductPricingFields'
import ProductBarcodesEditor from './ProductBarcodesEditor'
import ProductPriceTiersEditor from './ProductPriceTiersEditor'
import ComboItemsEditor from './ComboItemsEditor'
import VariantEditor from './VariantEditor'
import BatchEditor from './BatchEditor'
import { useProductForm, PRODUCT_UNITS } from '../hooks/useProductForm'
import { useProductTypes } from '../../../shared/hooks/useProductTypes'
import { toErrorMessage } from '../api/products.api'
import { hasPermission } from '../../../shared/lib/permissions'

interface AddProductModalProps {
  user: User
  isOpen: boolean
  onClose: () => void
  onSubmit: (input: ProductInput, productId?: string) => Promise<Product>
  initialProduct?: Product | null
  categories?: string[]
  products?: Product[]
}

export const AddProductModal: React.FC<AddProductModalProps> = ({
  user,
  isOpen,
  onClose,
  onSubmit,
  initialProduct,
  categories = [],
  products = []
}) => {
  const {
    values,
    update,
    setCostPrice,
    setProfitMarginPercent,
    setSalePrice,
    generateCode,
    marginDollar,
    marginPercent,
    toInput
  } = useProductForm(initialProduct, categories)
  const { types } = useProductTypes()
  const [isSaving, setIsSaving] = React.useState(false)
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [savedProduct, setSavedProduct] = React.useState<Product | null>(null)
  const product = savedProduct ?? initialProduct ?? null
  const persistedTypeKind =
    types.find((type) => type.id === product?.typeId)?.kind ?? product?.typeKind
  const isCombo = persistedTypeKind === 'combo'
  const canEditProduct = hasPermission(user, 'CAN_EDIT_PRODUCT')
  const canModifyPrice = hasPermission(user, 'CAN_MODIFY_PRICE')
  const canAdjustStock = hasPermission(user, 'CAN_ADJUST_STOCK')
  const canDeleteProduct = hasPermission(user, 'CAN_DELETE_PRODUCT')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!values.name.trim() || !values.code.trim() || values.salePrice <= 0) return
    setIsSaving(true)
    setSaveError(null)
    try {
      const submittedTypeId = values.typeId
      const saved = await onSubmit(toInput(), product?.id)
      setSavedProduct(saved)
      if (submittedTypeId && saved.typeId !== submittedTypeId) {
        setSaveError(
          'No se pudo confirmar el tipo seleccionado. Verifique el tipo y vuelva a guardar.'
        )
        return
      }

      const savedTypeKind = types.find((type) => type.id === saved.typeId)?.kind ?? saved.typeKind
      if (savedTypeKind === 'combo' && !isCombo) return
      onClose()
    } catch (error) {
      setSaveError(toErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-2 sm:p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
      <div
        className="w-full max-w-5xl max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] bg-white rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between gap-2 px-3 sm:px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] select-none">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-[4px] bg-[#0067C0]/10 text-[#0067C0]">
              <Package size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-[#1B1B1B] tracking-tight">
                {product ? 'Editar Producto' : 'Agregar Nuevo Producto'}
              </h2>
              <p className="text-[11px] text-[#717783]">
                Ingresa los datos para registrar el artículo en el catálogo de inventario
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="kbd-badge">ESC</span>
            <button
              disabled={isSaving}
              onClick={onClose}
              title="Cerrar (Esc)"
              className="p-1 text-[#717783] hover:text-[#C42B1C] hover:bg-[#F3F3F3] rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                setCostPrice={setCostPrice}
                setProfitMarginPercent={setProfitMarginPercent}
                setSalePrice={setSalePrice}
                marginDollar={marginDollar}
                marginPercent={marginPercent}
                isEditing={Boolean(product)}
                canModifyPrice={canModifyPrice}
                canAdjustStock={canAdjustStock}
                canDeleteProduct={canDeleteProduct}
              />
            </div>

            {product && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {canEditProduct && <ProductBarcodesEditor productId={product.id} />}
                {canModifyPrice && (
                  <ProductPriceTiersEditor productId={product.id} salePrice={values.salePrice} />
                )}
                {canEditProduct && isCombo && (
                  <ComboItemsEditor comboId={product.id} products={products} />
                )}
                {canEditProduct && !isCombo && !product.parentId && (
                  <VariantEditor
                    parent={product}
                    variantAttrs={values.variantAttrs}
                    onVariantAttrsChange={(json) => update('variantAttrs', json)}
                  />
                )}
                {canAdjustStock && !product.parentId && (
                  <BatchEditor
                    productId={product.id}
                    productName={product.name}
                    trackBatches={values.trackBatches}
                    onEnableTracking={() => update('trackBatches', true)}
                  />
                )}
              </div>
            )}
          </div>

          <div className="shrink-0 flex flex-wrap items-center justify-end gap-2.5 px-3 sm:px-5 py-2.5 bg-[#F9F9F9] border-t border-[#E5E5E5]">
            {saveError && (
              <p role="alert" className="w-full text-xs font-semibold text-[#C42B1C]">
                {saveError}
              </p>
            )}
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px] hover:bg-[#F9F9F9] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              Cancelar [ESC]
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-1.5 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] active:bg-[#004f96] rounded-[4px] shadow-xs transition-colors disabled:opacity-50 disabled:cursor-wait cursor-pointer"
            >
              <Check size={14} />
              <span>
                {isSaving ? 'Guardando…' : product ? 'Guardar Cambios' : 'Registrar Producto'}
              </span>
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
