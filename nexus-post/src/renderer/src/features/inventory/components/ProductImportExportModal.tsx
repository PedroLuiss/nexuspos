import React, { useState, useEffect } from 'react'
import type { Product, ProductInput } from '@shared/contracts'
import { FileSpreadsheet, X } from '../../../shared/icons/Icons'
import ProductExportTab from './ProductExportTab'
import ProductImportTab from './ProductImportTab'

interface ProductImportExportModalProps {
  isOpen: boolean
  initialTab?: 'export' | 'import'
  onClose: () => void
  products: Product[]
  onImportBatch: (inputs: ProductInput[]) => Promise<number>
}

export const ProductImportExportModal: React.FC<ProductImportExportModalProps> = ({
  isOpen,
  initialTab = 'export',
  onClose,
  products,
  onImportBatch
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab, isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-backdrop">
      <div className="w-full max-w-2xl bg-white rounded-[8px] shadow-[0_16px_32px_rgba(0,0,0,0.14)] border border-[#D1D1D1] overflow-hidden animate-modal flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#F9F9F9] border-b border-[#E5E5E5] select-none">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[4px] bg-[#107C41]/10 text-[#107C41] flex items-center justify-center">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-[#1B1B1B] tracking-tight">
                Importación y Exportación de Productos
              </h2>
              <p className="text-[11px] text-[#717783]">
                Compatibilidad total con Microsoft Excel (.csv UTF-8 / .xlsx)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#717783] hover:text-[#C42B1C] hover:bg-[#F3F3F3] p-1 rounded transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E5E5E5] px-5 bg-slate-50">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'export'
                ? 'border-[#0067C0] text-[#0067C0] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Exportar Catálogo ({products.length} productos)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`py-2.5 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'import'
                ? 'border-[#0067C0] text-[#0067C0] bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Importar desde Excel
          </button>
        </div>

        {/* Contenido de Tabs */}
        {activeTab === 'export' ? (
          <ProductExportTab products={products} />
        ) : (
          <ProductImportTab onImportBatch={onImportBatch} />
        )}

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 bg-[#F9F9F9] border-t border-[#E5E5E5]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white border border-[#D1D1D1] rounded-[4px] hover:bg-[#F9F9F9] cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductImportExportModal
