import React from 'react'
import {
  Plus,
  Minus,
  Barcode,
  FileSpreadsheet,
  Building2,
  Tags
} from '../../../shared/icons/Icons'

interface ProductToolbarProps {
  onAdd: () => void
  onOpenAdjustment: (mode: 'IN' | 'OUT') => void
  onOpenBarcode: () => void
  onOpenBranch: () => void
  onManageCategories: () => void
}

export const ProductToolbar: React.FC<ProductToolbarProps> = ({
  onAdd,
  onOpenAdjustment,
  onOpenBarcode,
  onOpenBranch,
  onManageCategories
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white border border-[#E5E5E5] rounded-[4px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex flex-wrap items-center gap-2">
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

        <button
          onClick={() =>
            alert('Seleccione archivo Excel (.xlsx) con columnas: Código, Nombre, Costo, Venta, Stock')
          }
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
        >
          <FileSpreadsheet size={14} className="text-[#107C41]" />
          <span>Importar Excel</span>
        </button>

        <button
          onClick={onOpenBarcode}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
        >
          <Barcode size={14} className="text-[#0067C0]" />
          <span>Imprimir Cód. Barras</span>
          <span className="kbd-badge">ALT+B</span>
        </button>

        <button
          onClick={onManageCategories}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1B1B1B] bg-white hover:bg-[#F9F9F9] border border-[#D1D1D1] rounded-[4px] transition-colors cursor-pointer"
        >
          <Tags size={14} className="text-[#0067C0]" />
          <span>Gestionar Categorías</span>
        </button>

        <button
          onClick={onOpenBranch}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0067C0] bg-[#EBF0F5] hover:bg-blue-100 border border-[#0067C0]/30 rounded-[4px] transition-colors cursor-pointer"
        >
          <Building2 size={14} className="text-[#0067C0]" />
          <span>Stock Sucursales</span>
          <span className="kbd-badge text-[#0067C0] bg-white border-[#0067C0]/30">ALT+O</span>
        </button>
      </div>

      <div>
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
      </div>
    </div>
  )
}

export default ProductToolbar
