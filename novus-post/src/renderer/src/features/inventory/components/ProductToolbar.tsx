import React from 'react'
import {
  Plus,
  Minus,
  Barcode,
  FileSpreadsheet,
  Download,
  Tags,
  Sparkles
} from '../../../shared/icons/Icons'
import type { User } from '@shared/contracts'
import { hasPermission } from '../../../shared/lib/permissions'

interface ProductToolbarProps {
  user: User
  onAdd: () => void
  onOpenAdjustment: (mode: 'IN' | 'OUT') => void
  onOpenBarcode: () => void
  onManageCategories: () => void
  onOpenImportExport: (tab: 'import' | 'export') => void
  onSeedDemoProducts?: () => void
}

export const ProductToolbar: React.FC<ProductToolbarProps> = ({
  user,
  onAdd,
  onOpenAdjustment,
  onOpenBarcode,
  onManageCategories,
  onOpenImportExport,
  onSeedDemoProducts
}) => {
  const canAdjustStock = hasPermission(user, 'CAN_ADJUST_STOCK')
  const canCreateProduct = hasPermission(user, 'CAN_CREATE_PRODUCT')
  const canEditProduct = hasPermission(user, 'CAN_EDIT_PRODUCT')
  const canAccessInventory = hasPermission(user, 'inventory')

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center gap-2">
        {canAdjustStock && (
          <button
            onClick={() => onOpenAdjustment('IN')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#107C41] bg-white hover:bg-emerald-50 border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
          >
            <Plus size={14} className="text-[#107C41]" />
            <span>Entradas Masivas</span>
            <span className="font-mono text-[10px] text-[#107C41] bg-emerald-50 px-1 rounded border border-emerald-200">
              [ALT+E]
            </span>
          </button>
        )}

        {canAdjustStock && (
          <button
            onClick={() => onOpenAdjustment('OUT')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#C42B1C] bg-white hover:bg-red-50 border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
          >
            <Minus size={14} className="text-[#C42B1C]" />
            <span>Salidas Masivas</span>
            <span className="font-mono text-[10px] text-[#C42B1C] bg-red-50 px-1 rounded border border-red-200">
              [ALT+S]
            </span>
          </button>
        )}

        {canCreateProduct && (
          <button
            onClick={() => onOpenImportExport('import')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
            title="Importar catálogo desde archivo Excel / CSV"
          >
            <FileSpreadsheet size={14} className="text-[#107C41]" />
            <span>Importar Excel</span>
          </button>
        )}

        {canAccessInventory && (
          <button
            onClick={() => onOpenImportExport('export')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
            title="Exportar inventario a Excel / CSV"
          >
            <Download size={14} className="text-[#0067C0]" />
            <span>Exportar Excel</span>
          </button>
        )}

        {canAccessInventory && (
          <button
            onClick={onOpenBarcode}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
          >
            <Barcode size={14} className="text-[#0067C0]" />
            <span>Imprimir Cód. Barras</span>
            <span className="kbd-badge">ALT+B</span>
          </button>
        )}

        {canEditProduct && (
          <button
            onClick={onManageCategories}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
          >
            <Tags size={14} className="text-[#0067C0]" />
            <span>Categorías</span>
          </button>
        )}

        {canCreateProduct && onSeedDemoProducts && (
          <button
            onClick={onSeedDemoProducts}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-[4px] transition-colors cursor-pointer"
            title="Cargar o actualizar los 50 productos de prueba"
          >
            <Sparkles size={13} className="text-purple-600" />
            <span>50 Demos</span>
          </button>
        )}
      </div>

      <div>
        {canCreateProduct && (
          <button
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#0067C0] hover:bg-[#0078D4] active:bg-[#004f96] rounded-[4px] shadow-xs transition-colors cursor-pointer"
          >
            <Plus size={15} />
            <span>Nuevo Producto</span>
            <span className="font-mono text-[10px] bg-white/20 px-1.5 py-0.2 rounded text-white">
              [ALT+N]
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

export default ProductToolbar
