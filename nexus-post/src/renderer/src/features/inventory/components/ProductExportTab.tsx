import React, { useState } from 'react'
import type { Product } from '@shared/contracts'
import { FileText, Download } from '../../../shared/icons/Icons'
import { useBrands } from '../../../shared/hooks/useBrands'
import { useSuppliers } from '../../../shared/hooks/useSuppliers'
import { useProductTypes } from '../../../shared/hooks/useProductTypes'
import { buildProductCatalogCsv } from '../lib/productCsv'

interface ProductExportTabProps {
  products: Product[]
}

export const ProductExportTab: React.FC<ProductExportTabProps> = ({ products }) => {
  const { brands } = useBrands()
  const { suppliers } = useSuppliers()
  const { types } = useProductTypes()
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const handleExportCsv = (): void => {
    const csvContent = '\uFEFF' + buildProductCatalogCsv(products, brands, suppliers, types)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const dateStr = new Date().toISOString().split('T')[0]

    link.setAttribute('href', url)
    link.setAttribute('download', `nexuspos_catalogo_productos_${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const handleExportXlsx = async (): Promise<void> => {
    setIsExporting(true)
    setExportError(null)
    try {
      const { downloadProductCatalogXlsx } = await import('../lib/productSpreadsheet')
      await downloadProductCatalogXlsx(products, brands, suppliers, types)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'No se pudo generar el archivo Excel.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="p-6 space-y-4 text-xs">
      <div className="p-4 rounded-[6px] bg-[#F9F9F9] border border-slate-200 flex items-start gap-3">
        <FileText size={20} className="text-[#0067C0] shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-800">
            Descarga del catálogo en Excel (.xlsx) o CSV
          </p>
          <p className="text-slate-500 text-[11px] mt-0.5">
            El Excel incluye hojas con formato, filtros y resumen. Ambos formatos incluyen impuestos,
            marca, proveedor y tipo; el CSV se genera con UTF-8 BOM para Excel de Windows.
          </p>
        </div>
      </div>

      {exportError && (
        <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {exportError}
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
        <span className="text-slate-600 font-mono text-[11px]">
          {products.length} artículos listos para descarga
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isExporting}
            onClick={() => void handleExportXlsx()}
            className="flex items-center gap-2 px-4 py-2 bg-[#107C41] hover:bg-emerald-700 text-white font-bold rounded-[4px] shadow-xs cursor-pointer transition-colors disabled:opacity-50"
          >
            <Download size={15} />
            <span>{isExporting ? 'Preparando Excel…' : 'Descargar Excel (.xlsx)'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-[4px] cursor-pointer transition-colors"
          >
            <Download size={15} />
            <span>Descargar CSV</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductExportTab
