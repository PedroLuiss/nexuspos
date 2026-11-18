import React, { useEffect, useState } from 'react'
import type { Product, ProductInput, KardexReason } from '@shared/contracts'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { useProductFilters } from '../hooks/useProductFilters'
import { useTaxes } from '../../../shared/hooks/useTaxes'
import { useBrands } from '../../../shared/hooks/useBrands'
import { useSuppliers } from '../../../shared/hooks/useSuppliers'
import { useProductTypes } from '../../../shared/hooks/useProductTypes'
import { toErrorMessage } from '../api/products.api'
import AddProductModal from './AddProductModal'
import BarcodeGeneratorModal from './BarcodeGeneratorModal'
import StockAdjustmentModal from './StockAdjustmentModal'
import CategoryManagerModal from './CategoryManagerModal'
import ProductImportExportModal from './ProductImportExportModal'
import ProductToolbar from './ProductToolbar'
import ProductFilters from './ProductFilters'
import ProductRows from './ProductRows'
import ProductStatusBar from './ProductStatusBar'

export const ProductTable: React.FC = () => {
  const {
    products,
    error,
    reload,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleStatus,
    adjustStock
  } = useProducts()

  const categoryManager = useCategories()
  const categoryNames = categoryManager.activeNames

  const { taxes } = useTaxes()
  const { brands } = useBrands()
  const { suppliers } = useSuppliers()
  const { types } = useProductTypes()
  const filters = useProductFilters(products, taxes, brands, suppliers, types)

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [adjustmentMode, setAdjustmentMode] = useState<'IN' | 'OUT' | null>(null)
  const [isImportExportOpen, setIsImportExportOpen] = useState(false)
  const [importExportTab, setImportExportTab] = useState<'import' | 'export'>('export')

  const anyModalOpen =
    isModalOpen ||
    isBarcodeModalOpen ||
    isCategoryModalOpen ||
    isImportExportOpen ||
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
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [anyModalOpen])

  const handleEdit = (product: Product): void => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleSave = async (input: ProductInput, productId?: string): Promise<Product> => {
    const id = productId ?? editingProduct?.id
    if (id) return updateProduct({ ...input, id })
    return createProduct(input)
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

  const handleImportBatch = async (inputs: ProductInput[]): Promise<number> => {
    let count = 0
    for (const input of inputs) {
      try {
        await createProduct(input)
        count++
      } catch {
        // Continuar con los siguientes si hay algún duplicado
      }
    }
    await reload()
    return count
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
        onManageCategories={() => setIsCategoryModalOpen(true)}
        onOpenImportExport={(tab) => {
          setImportExportTab(tab)
          setIsImportExportOpen(true)
        }}
        onSeedDemoProducts={async () => {
          await reload()
        }}
      />

      <ProductFilters
        searchTerm={filters.searchTerm}
        onSearchChange={filters.setSearchTerm}
        categories={filters.categories}
        selectedCategory={filters.selectedCategory}
        onCategoryChange={filters.setSelectedCategory}
        stockFilter={filters.stockFilter}
        onStockFilterChange={filters.setStockFilter}
        taxOptions={filters.taxOptions}
        selectedTax={filters.taxFilter}
        onTaxChange={filters.setTaxFilter}
        brandOptions={filters.brandOptions}
        selectedBrand={filters.brandFilter}
        onBrandChange={filters.setBrandFilter}
        supplierOptions={filters.supplierOptions}
        selectedSupplier={filters.supplierFilter}
        onSupplierChange={filters.setSupplierFilter}
        typeOptions={filters.typeOptions}
        selectedType={filters.typeFilter}
        onTypeChange={filters.setTypeFilter}
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
          products={products}
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

      {isImportExportOpen && (
        <ProductImportExportModal
          isOpen={isImportExportOpen}
          initialTab={importExportTab}
          onClose={() => setIsImportExportOpen(false)}
          products={filters.filtered}
          onImportBatch={handleImportBatch}
        />
      )}
    </div>
  )
}

export default ProductTable
