import React, { useState, useMemo, useEffect } from 'react'
import { Product, KardexReason } from '../../../shared/types/domain'
import AddProductModal from './AddProductModal'
import BarcodeGeneratorModal from './BarcodeGeneratorModal'
import StockAdjustmentModal from './StockAdjustmentModal'
import StockBranchModal from './StockBranchModal'
import {
  Search,
  Plus,
  Minus,
  Edit3,
  Trash2,
  Power,
  Package,
  AlertCircle,
  Filter,
  Barcode,
  FileSpreadsheet,
  Building2
} from '../../../shared/icons/Icons'

interface ProductTableProps {
  products: Product[]
  onAddProduct: (product: Omit<Product, 'id'>) => void
  onUpdateProduct: (product: Product) => void
  onDeleteProduct: (id: string) => void
  onToggleStatus: (id: string) => void
  onStockAdjustment: (productId: string, quantity: number, reason: KardexReason, notes: string) => void
}

export const ProductTable: React.FC<ProductTableProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onToggleStatus,
  onStockAdjustment
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Submodals
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false)
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false)
  const [adjustmentMode, setAdjustmentMode] = useState<'IN' | 'OUT' | null>(null)

  // Hotkeys listener for products module
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (isModalOpen || isBarcodeModalOpen || isBranchModalOpen || adjustmentMode !== null) return

      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault()
        setEditingProduct(null)
        setIsModalOpen(true)
      } else if (e.altKey && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault()
        setAdjustmentMode('IN')
      } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        setAdjustmentMode('OUT')
      } else if (e.altKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault()
        setIsBarcodeModalOpen(true)
      } else if (e.altKey && (e.key === 'o' || e.key === 'O')) {
        e.preventDefault()
        setIsBranchModalOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen, isBarcodeModalOpen, isBranchModalOpen, adjustmentMode])

  // Unique categories
  const categories = useMemo(() => {
    const list = Array.from(new Set(products.map((p) => p.category)))
    return ['ALL', ...list]
  }, [products])

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory =
        selectedCategory === 'ALL' || p.category === selectedCategory

      const matchesStock =
        stockFilter === 'ALL'
          ? true
          : stockFilter === 'LOW'
            ? p.stock > 0 && p.stock <= p.minStock
            : p.stock === 0

      return matchesSearch && matchesCategory && matchesStock
    })
  }, [products, searchTerm, selectedCategory, stockFilter])

  // Quick stats
  const totalStockCount = products.reduce((acc, p) => acc + p.stock, 0)
  const totalInventoryValue = products.reduce((acc, p) => acc + p.stock * p.costPrice, 0)
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStock).length
  const outOfStockCount = products.filter((p) => p.stock === 0).length

  const handleEdit = (product: Product): void => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleSaveProduct = (productData: Omit<Product, 'id'>): void => {
    if (editingProduct) {
      onUpdateProduct({ ...productData, id: editingProduct.id })
    } else {
      onAddProduct(productData)
    }
    setEditingProduct(null)
  }

  return (
    <div className="flex flex-col h-full p-3 space-y-2.5 bg-[#F3F3F3]">
      {/* Top Action Toolbar (Fluent Box) */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        {/* Quick Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Entradas Masivas */}
          <button
            onClick={() => setAdjustmentMode('IN')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#107C41] bg-white hover:bg-emerald-50 border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
          >
            <Plus size={14} className="text-[#107C41]" />
            <span>Entradas Masivas</span>
            <span className="font-mono text-[10px] text-[#107C41] bg-emerald-50 px-1 rounded border border-emerald-200">
              [ALT+E]
            </span>
          </button>

          {/* Salidas Masivas */}
          <button
            onClick={() => setAdjustmentMode('OUT')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#C42B1C] bg-white hover:bg-red-50 border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
          >
            <Minus size={14} className="text-[#C42B1C]" />
            <span>Salidas Masivas</span>
            <span className="font-mono text-[10px] text-[#C42B1C] bg-red-50 px-1 rounded border border-red-200">
              [ALT+S]
            </span>
          </button>

          {/* Importar Excel */}
          <button
            onClick={() => alert('Seleccione archivo Excel (.xlsx) con columnas: Código, Nombre, Costo, Venta, Stock')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-[#107C41]" />
            <span>Importar Excel</span>
          </button>

          {/* Generar Códigos de Barras */}
          <button
            onClick={() => setIsBarcodeModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
          >
            <Barcode size={14} className="text-[#0067C0]" />
            <span>Imprimir Cód. Barras</span>
            <span className="kbd-badge">
              ALT+B
            </span>
          </button>

          {/* Consulta Stock Sucursales ALT+O */}
          <button
            onClick={() => setIsBranchModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0067C0] bg-[#EBF0F5] hover:bg-blue-100 border border-[#0067C0]/30 rounded-[4px] transition-colors cursor-pointer"
          >
            <Building2 size={14} className="text-[#0067C0]" />
            <span>Stock Sucursales</span>
            <span className="kbd-badge text-[#0067C0] bg-white border-[#0067C0]/30">
              ALT+O
            </span>
          </button>
        </div>

        {/* Add Product Primary Button (Accent Primary: #0067C0) */}
        <div>
          <button
            onClick={() => {
              setEditingProduct(null)
              setIsModalOpen(true)
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] active:bg-[#004f96] rounded-[4px] shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>Nuevo Producto</span>
            <span className="font-mono text-[10px] bg-white/20 px-1.5 py-0.2 rounded text-white">
              [ALT+N]
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="relative flex-1 min-w-[260px] max-w-sm">
          <Search
            size={15}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#717783]"
          />
          <input
            type="text"
            placeholder="Buscar por código, descripción o categoría [F2]..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] focus:bg-white focus:border-[#0067C0] focus:ring-1 focus:ring-[#0067C0] text-[#1B1B1B]"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter size={14} className="text-[#717783]" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] text-[#1B1B1B] font-medium"
            >
              <option value="ALL">Todas las Categorías</option>
              {categories
                .filter((c) => c !== 'ALL')
                .map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
            </select>
          </div>

          {/* Stock Filter Chips (Fluent Pills) */}
          <div className="flex items-center gap-1 bg-[#F3F3F3] p-0.5 rounded-[4px] border border-[#E5E5E5] text-xs">
            <button
              onClick={() => setStockFilter('ALL')}
              className={`px-2.5 py-1 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer ${
                stockFilter === 'ALL'
                  ? 'bg-white text-[#0067C0] shadow-xs'
                  : 'text-[#5C5C5C] hover:text-[#1B1B1B]'
              }`}
            >
              Todos ({products.length})
            </button>
            <button
              onClick={() => setStockFilter('LOW')}
              className={`px-2.5 py-1 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer ${
                stockFilter === 'LOW'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-[#5C5C5C] hover:text-[#1B1B1B]'
              }`}
            >
              Bajo Stock ({lowStockCount})
            </button>
            <button
              onClick={() => setStockFilter('OUT')}
              className={`px-2.5 py-1 rounded-[3px] text-xs font-semibold transition-colors cursor-pointer ${
                stockFilter === 'OUT'
                  ? 'bg-white text-[#C42B1C] shadow-xs'
                  : 'text-[#5C5C5C] hover:text-[#1B1B1B]'
              }`}
            >
              Agotados ({outOfStockCount})
            </button>
          </div>
        </div>
      </div>

      {/* Dense Fluent Desktop Data Table (Stitch Specification) */}
      <div className="flex-1 overflow-hidden bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_2px_4px_rgba(0,0,0,0.04)] flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#F9F9F9] border-b border-[#E5E5E5] text-[#1B1B1B] font-semibold text-[11px] uppercase tracking-wider select-none shadow-xs">
              <tr>
                <th className="py-2.5 px-3 w-28">CÓDIGO</th>
                <th className="py-2.5 px-3">DESCRIPCIÓN</th>
                <th className="py-2.5 px-3 text-right w-24">COSTO</th>
                <th className="py-2.5 px-3 text-right w-24">VENTA</th>
                <th className="py-2.5 px-3 w-36">CATEGORÍA</th>
                <th className="py-2.5 px-3 text-center w-24">STOCK</th>
                <th className="py-2.5 px-3 text-center w-20">MÍNIMO</th>
                <th className="py-2.5 px-3 text-center w-24">ESTADO</th>
                <th className="py-2.5 px-3 text-center w-28">ACCIONES</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#E5E5E5]">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-[#717783]">
                    <Package size={40} className="mx-auto mb-2 text-[#D1D1D1]" />
                    <p className="text-xs font-semibold text-[#1B1B1B]">No se encontraron productos registrados</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.stock > 0 && p.stock <= p.minStock
                  const isOut = p.stock === 0
                  const isSelected = selectedProductId === p.id

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedProductId(p.id)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected
                          ? 'bg-[#EBF0F5] border-l-4 border-l-[#0067C0]'
                          : 'even:bg-[#FDFDFD] hover:bg-[#F9F9F9]'
                      }`}
                      style={{ height: '40px' }}
                    >
                      {/* Código */}
                      <td className="py-2 px-3 font-mono text-xs text-[#5C5C5C] font-semibold">
                        {p.code}
                      </td>

                      {/* Descripción */}
                      <td className="py-2 px-3">
                        <div className="font-semibold text-xs text-[#1B1B1B]">{p.name}</div>
                        {p.description && (
                          <div className="text-[10px] text-[#717783] truncate max-w-sm">
                            {p.description}
                          </div>
                        )}
                      </td>

                      {/* Costo */}
                      <td className="py-2 px-3 text-right font-mono font-medium text-xs text-[#5C5C5C]">
                        ${p.costPrice.toFixed(2)}
                      </td>

                      {/* Venta */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-xs text-[#0067C0]">
                        ${p.salePrice.toFixed(2)}
                      </td>

                      {/* Categoría */}
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded-[2px] text-[10px] bg-[#F3F3F3] text-[#5C5C5C] border border-[#E5E5E5] font-medium">
                          {p.category}
                        </span>
                      </td>

                      {/* Stock */}
                      <td className="py-2 px-3 text-center font-mono font-bold">
                        <span
                          className={
                            isOut ? 'text-[#C42B1C]' : isLow ? 'text-amber-600' : 'text-[#1B1B1B]'
                          }
                        >
                          {p.stock}
                        </span>
                        <span className="text-[10px] font-normal text-[#717783] ml-1">
                          {p.unit.split(' ')[0]}
                        </span>
                      </td>

                      {/* Mínimo */}
                      <td className="py-2 px-3 text-center font-mono text-[#717783]">
                        {p.minStock}
                      </td>

                      {/* Estado */}
                      <td className="py-2 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold ${
                            p.active
                              ? 'bg-emerald-50 text-[#107C41] border border-emerald-200'
                              : 'bg-[#EBEBEB] text-[#717783] border border-[#D1D1D1]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              p.active ? 'bg-[#107C41]' : 'bg-[#717783]'
                            }`}
                          ></span>
                          {p.active ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-2 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Toggle Activar/Desactivar */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onToggleStatus(p.id)
                            }}
                            title={p.active ? 'Desactivar producto' : 'Activar producto'}
                            className="p-1 rounded text-[#717783] hover:text-amber-600 hover:bg-amber-50 cursor-pointer"
                          >
                            <Power size={13} />
                          </button>

                          {/* Editar */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(p)
                            }}
                            title="Editar ficha"
                            className="p-1 rounded text-[#717783] hover:text-[#0067C0] hover:bg-blue-50 cursor-pointer"
                          >
                            <Edit3 size={13} />
                          </button>

                          {/* Eliminar (Soft Delete) */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm(`¿Dar de baja el producto "${p.name}"?`)) {
                                onDeleteProduct(p.id)
                              }
                            }}
                            title="Eliminar producto"
                            className="p-1 rounded text-[#717783] hover:text-[#C42B1C] hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Status Ribbon */}
        <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-[#F9F9F9] border-t border-[#E5E5E5] text-xs text-[#5C5C5C]">
          <div className="flex items-center gap-4">
            <span>
              Total Catálogo: <strong className="text-[#1B1B1B] font-mono">{products.length}</strong> productos
            </span>
            <span>•</span>
            <span>
              Existencias Totales: <strong className="text-[#1B1B1B] font-mono">{totalStockCount}</strong> unidades
            </span>
            <span>•</span>
            <span>
              Valuación Inventario (Costo): <strong className="text-[#107C41] font-mono font-bold">${totalInventoryValue.toFixed(2)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {lowStockCount > 0 && (
              <span className="flex items-center gap-1 text-amber-700 font-semibold text-[11px]">
                <AlertCircle size={13} /> {lowStockCount} con stock bajo
              </span>
            )}
            {outOfStockCount > 0 && (
              <span className="flex items-center gap-1 text-[#C42B1C] font-semibold text-[11px]">
                <AlertCircle size={13} /> {outOfStockCount} agotados
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <AddProductModal
        isOpen={isModalOpen}
        initialProduct={editingProduct || undefined}
        onClose={() => {
          setIsModalOpen(false)
          setEditingProduct(null)
        }}
        onSaveProduct={handleSaveProduct}
      />

      {/* Barcode Generator Modal */}
      <BarcodeGeneratorModal
        isOpen={isBarcodeModalOpen}
        products={products}
        onClose={() => setIsBarcodeModalOpen(false)}
      />

      {/* Mass Stock Adjustment Modal (Entradas / Salidas) */}
      <StockAdjustmentModal
        isOpen={adjustmentMode !== null}
        mode={adjustmentMode || 'IN'}
        products={products}
        onClose={() => setAdjustmentMode(null)}
        onConfirmAdjustment={onStockAdjustment}
      />

      {/* Multi-Branch Stock Consultation & Transfer Modal (ALT+O) */}
      <StockBranchModal
        isOpen={isBranchModalOpen}
        products={products}
        onClose={() => setIsBranchModalOpen(false)}
        onConfirmTransfer={(details) => {
          alert(`Solicitud de traslado registrada: ${details.quantity} pzas (Motivo: ${details.reason})`)
        }}
      />
    </div>
  )
}

export default ProductTable
