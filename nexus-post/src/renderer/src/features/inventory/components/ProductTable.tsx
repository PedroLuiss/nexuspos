import React, { useEffect, useState } from 'react'
import type { Product, ProductInput, KardexReason } from '@shared/contracts'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { useProductFilters } from '../hooks/useProductFilters'
import { toErrorMessage } from '../api/products.api'
import AddProductModal from './AddProductModal'
import BarcodeGeneratorModal from './BarcodeGeneratorModal'
import StockAdjustmentModal from './StockAdjustmentModal'
import StockBranchModal from './StockBranchModal'
import CategoryManagerModal from './CategoryManagerModal'
import ProductToolbar from './ProductToolbar'
import ProductFilters from './ProductFilters'
import ProductRows from './ProductRows'
import ProductStatusBar from './ProductStatusBar'

export const ProductTable: React.FC = () => {
  const {
    products,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleStatus,
    adjustStock
  } = useProducts()

  const categoryManager = useCategories()
  const categoryNames = categoryManager.activeNames

  const filters = useProductFilters(products)

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [adjustmentMode, setAdjustmentMode] = useState<'IN' | 'OUT' | null>(null)

  const anyModalOpen =
    isModalOpen ||
    isBarcodeModalOpen ||
    isBranchModalOpen ||
    isCategoryModalOpen ||
    adjustmentMode !== null

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (anyModalOpen || !e.altKey) return

      const key = e.key.toLowerCase()
      if (key === 'n') {
        e.preventDefault()
        setEditingProduct(null)
        setIsModalOpen(true)
      } else if (key === 'e') {
        e.preventDefault()
        setAdjustmentMode('IN')
      } else if (key === 's') {
        e.preventDefault()
        setAdjustmentMode('OUT')
      } else if (key === 'b') {
        e.preventDefault()
        setIsBarcodeModalOpen(true)
      } else if (key === 'o') {
        e.preventDefault()
        setIsBranchModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [anyModalOpen])

  const handleEdit = (product: Product): void => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleSave = async (input: ProductInput): Promise<void> => {
    try {
      if (editingProduct) {
        await updateProduct({ ...input, id: editingProduct.id })
        window.alert(`Producto "${input.name}" modificado`)
      } else {
        await createProduct(input)
        window.alert(`Producto "${input.name}" creado en catálogo`)
      }
    } catch (err) {
      window.alert(toErrorMessage(err))
    }
  }

  const handleDelete = async (product: Product): Promise<void> => {
    if (!window.confirm(`¿Dar de baja el producto "${product.name}"?`)) return
    try {
      await deleteProduct(product.id)
    } catch (err) {
      window.alert(toErrorMessage(err))
    }
  }

  const handleToggleStatus = async (id: string): Promise<void> => {
    try {
      await toggleStatus(id)
    } catch (err) {
      window.alert(toErrorMessage(err))
    }
  }

  const handleStockAdjustment = async (
    productId: string,
    quantity: number,
    reason: KardexReason,
    notes: string
  ): Promise<void> => {
    try {
      await adjustStock({ productId, quantity, reason, notes, responsibleUser: 'Cajero' })
    } catch (err) {
      window.alert(toErrorMessage(err))
    }
  }

  return (
    <div className="flex flex-col h-full p-3 space-y-2.5 bg-[#F3F3F3]">
      {error && (
        <div className="px-3 py-2 text-xs font-semibold text-[#C42B1C] bg-red-50 border border-red-200 rounded-[4px]">
          {error}
        </div>
      )}

      <ProductToolbar
        onAdd={() => {
          setEditingProduct(null)
          setIsModalOpen(true)
        }}
        onOpenAdjustment={(mode) => setAdjustmentMode(mode)}
        onOpenBarcode={() => setIsBarcodeModalOpen(true)}
        onOpenBranch={() => setIsBranchModalOpen(true)}
        onManageCategories={() => setIsCategoryModalOpen(true)}
      />

      <ProductFilters
        searchTerm={filters.searchTerm}
        onSearchChange={filters.setSearchTerm}
        categories={filters.categories}
        selectedCategory={filters.selectedCategory}
        onCategoryChange={filters.setSelectedCategory}
        stockFilter={filters.stockFilter}
        onStockFilterChange={filters.setStockFilter}
        counts={{
          all: filters.stats.total,
          low: filters.stats.lowStock,
          out: filters.stats.outOfStock
        }}
      />

      <div className="flex-1 overflow-hidden bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_2px_4px_rgba(0,0,0,0.04)] flex flex-col">
        <ProductRows
          products={filters.filtered}
          selectedProductId={selectedProductId}
          onSelect={setSelectedProductId}
          onToggleStatus={handleToggleStatus}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        <ProductStatusBar stats={filters.stats} />
      </div>

      {isModalOpen && (
        <AddProductModal
          isOpen={isModalOpen}
          initialProduct={editingProduct}
          categories={categoryNames}
          onClose={() => {
            setIsModalOpen(false)
            setEditingProduct(null)
          }}
          onSubmit={handleSave}
        />
      )}

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        manager={categoryManager}
      />

      <BarcodeGeneratorModal
        isOpen={isBarcodeModalOpen}
        products={products}
        onClose={() => setIsBarcodeModalOpen(false)}
      />

      <StockAdjustmentModal
        isOpen={adjustmentMode !== null}
        mode={adjustmentMode || 'IN'}
        products={products}
        onClose={() => setAdjustmentMode(null)}
        onConfirmAdjustment={handleStockAdjustment}
      />

      <StockBranchModal
        isOpen={isBranchModalOpen}
        products={products}
        onClose={() => setIsBranchModalOpen(false)}
        onConfirmTransfer={(details) => {
          window.alert(
            `Solicitud de traslado registrada: ${details.quantity} pzas (Motivo: ${details.reason})`
          )
        }}
      />
    </div>
  )
}

export default ProductTable
