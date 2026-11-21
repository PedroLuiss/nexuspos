import React from 'react'
import type {
  Product,
  ProductInput,
  KardexMovementType,
  KardexReason,
  User
} from '@shared/contracts'
import AddProductModal from './AddProductModal'
import CategoryManagerModal from './CategoryManagerModal'
import BarcodeGeneratorModal from './BarcodeGeneratorModal'
import StockAdjustmentModal from './StockAdjustmentModal'
import ProductImportExportModal from './ProductImportExportModal'
import type { useCategories } from '../hooks/useCategories'
import type { ProductImportBatchResult } from './ProductImportTab'

interface ProductTableModalsProps {
  user: User
  isModalOpen: boolean
  editingProduct: Product | null
  categoryNames: string[]
  products: Product[]
  onCloseModal: () => void
  onSaveProduct: (input: ProductInput, productId?: string) => Promise<Product>
  confirmationDialog: React.ReactNode
  isCategoryModalOpen: boolean
  onCloseCategoryModal: () => void
  categoryManager: ReturnType<typeof useCategories>
  isBarcodeModalOpen: boolean
  fullCatalog: Product[]
  onCloseBarcodeModal: () => void
  adjustmentMode: 'IN' | 'OUT' | null
  onCloseAdjustment: () => void
  onConfirmAdjustment: (
    productId: string,
    type: KardexMovementType,
    quantity: number,
    reason: KardexReason,
    notes: string
  ) => Promise<void>
  isImportExportOpen: boolean
  importExportTab: 'import' | 'export'
  isLoadingFullCatalog: boolean
  onCloseImportExport: () => void
  onImportBatch: (
    inputs: ProductInput[],
    onProgress?: (completed: number, total: number) => void
  ) => Promise<ProductImportBatchResult>
}

export const ProductTableModals: React.FC<ProductTableModalsProps> = ({
  user,
  isModalOpen,
  editingProduct,
  categoryNames,
  products,
  onCloseModal,
  onSaveProduct,
  confirmationDialog,
  isCategoryModalOpen,
  onCloseCategoryModal,
  categoryManager,
  isBarcodeModalOpen,
  fullCatalog,
  onCloseBarcodeModal,
  adjustmentMode,
  onCloseAdjustment,
  onConfirmAdjustment,
  isImportExportOpen,
  importExportTab,
  isLoadingFullCatalog,
  onCloseImportExport,
  onImportBatch
}) => {
  return (
    <>
      {isModalOpen && (
        <AddProductModal
          user={user}
          isOpen={isModalOpen}
          initialProduct={editingProduct}
          categories={categoryNames}
          products={products}
          onClose={onCloseModal}
          onSubmit={onSaveProduct}
        />
      )}

      {confirmationDialog}

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={onCloseCategoryModal}
        manager={categoryManager}
      />

      <BarcodeGeneratorModal
        isOpen={isBarcodeModalOpen}
        products={fullCatalog}
        onClose={onCloseBarcodeModal}
      />

      <StockAdjustmentModal
        key={adjustmentMode ?? 'closed'}
        isOpen={adjustmentMode !== null}
        mode={adjustmentMode || 'IN'}
        products={products}
        onClose={onCloseAdjustment}
        onConfirmAdjustment={onConfirmAdjustment}
      />

      {isImportExportOpen && (
        <ProductImportExportModal
          isOpen={isImportExportOpen}
          initialTab={importExportTab}
          onClose={onCloseImportExport}
          products={fullCatalog}
          isLoadingProducts={isLoadingFullCatalog}
          onImportBatch={onImportBatch}
        />
      )}
    </>
  )
}

export default ProductTableModals
