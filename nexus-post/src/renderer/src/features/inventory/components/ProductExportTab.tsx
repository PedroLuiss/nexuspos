import React from 'react'
import type { Product } from '@shared/contracts'
import { FileText, Download } from '../../../shared/icons/Icons'

interface ProductExportTabProps {
  products: Product[]
}

export const ProductExportTab: React.FC<ProductExportTabProps> = ({ products }) => {
  const handleExportCsv = (): void => {
    const headers = [
      'Codigo',
      'Nombre',
      'Categoria',
      'PrecioCosto',
      'PrecioVenta',
      'Stock',
      'StockMinimo',
      'Unidad',
      'Descripcion',
      'TieneImpuesto',
      'ImagenURL'
    ]

    const csvRows = products.map((p) => [
      `"${p.code.replace(/"/g, '""')}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      p.costPrice.toFixed(2),
      p.salePrice.toFixed(2),
      p.stock,
      p.minStock,
      `"${p.unit.replace(/"/g, '""')}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      p.hasTax ? 'SI' : 'NO',
      `"${(p.imageUrl || '').replace(/"/g, '""')}"`
    ])

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const dateStr = new Date().toISOString().split('T')[0]

    link.setAttribute('href', url)
    link.setAttribute('download', `nexuspos_catalogo_productos_${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-4 text-xs">
      <div className="p-4 rounded-[6px] bg-[#F9F9F9] border border-slate-200 flex items-start gap-3">
        <FileText size={20} className="text-[#0067C0] shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-slate-800">
            Descarga del inventario completo en formato Excel / CSV
          </p>
          <p className="text-slate-500 text-[11px] mt-0.5">
            El archivo generado incluye codificación internacional UTF-8 BOM, lo que garantiza que
            acentos y caracteres especiales se abran sin errores en Excel de Windows.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3">
        <span className="text-slate-600 font-mono text-[11px]">
          {products.length} artículos listos para descarga
        </span>
        <button
          type="button"
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2 bg-[#107C41] hover:bg-emerald-700 text-white font-bold rounded-[4px] shadow-xs cursor-pointer transition-colors"
        >
          <Download size={15} />
          <span>Descargar Archivo Excel (.csv)</span>
        </button>
      </div>
    </div>
  )
}

export default ProductExportTab
