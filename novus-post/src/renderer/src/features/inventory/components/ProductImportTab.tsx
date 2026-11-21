import React, { useState, useRef } from 'react'
import type { Product, ProductInput } from '@shared/contracts'
import { Upload, Check, AlertCircle } from '../../../shared/icons/Icons'
import { useTaxes } from '../../../shared/hooks/useTaxes'
import { useBrands } from '../../../shared/hooks/useBrands'
import { useSuppliers } from '../../../shared/hooks/useSuppliers'
import { useProductTypes } from '../../../shared/hooks/useProductTypes'
import { formatTaxLabel } from '@shared/lib/tax'
import { useTablePagination } from '../hooks/useTablePagination'
import TablePagination from './TablePagination'
import { useBusinessConfig } from '../../../shared/hooks/useBusinessConfig'
import { formatCurrency } from '../../../shared/lib/currency'

interface ProductImportTabProps {
  onImportBatch: (
    inputs: ProductInput[],
    onProgress?: (completed: number, total: number) => void
  ) => Promise<ProductImportBatchResult>
  products: Product[]
}

export interface ProductImportBatchResult {
  created: number
  errors: string[]
}

export const ProductImportTab: React.FC<ProductImportTabProps> = ({ onImportBatch, products }) => {
  const { config } = useBusinessConfig()
  const { taxes, defaultTax, error: taxesError } = useTaxes()
  const { brands, error: brandsError } = useBrands()
  const { suppliers, error: suppliersError } = useSuppliers()
  const { types, error: typesError } = useProductTypes()
  const [parsedRows, setParsedRows] = useState<ProductInput[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
  const [importProgress, setImportProgress] = useState({ completed: 0, total: 0 })
  const [importedCount, setImportedCount] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const preview = useTablePagination(parsedRows)

  const handleDownloadTemplate = async (): Promise<void> => {
    setIsDownloadingTemplate(true)
    try {
      const { downloadProductTemplateXlsx } = await import('../lib/productSpreadsheet')
      await downloadProductTemplateXlsx()
    } catch (err) {
      setParseErrors([
        err instanceof Error ? err.message : 'No se pudo generar la plantilla de Excel.'
      ])
    } finally {
      setIsDownloadingTemplate(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const input = e.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    setImportedCount(null)
    setParseErrors([])
    setParsedRows([])
    try {
      const { parseProductSpreadsheet } = await import('../lib/productSpreadsheet')
      const { rows, errors } = await parseProductSpreadsheet(
        file,
        taxes,
        brands,
        suppliers,
        types,
        defaultTax,
        products
      )
      setParsedRows(rows)
      setParseErrors(errors)
    } catch (err) {
      setParseErrors([
        err instanceof Error
          ? `No se pudo leer el archivo: ${err.message}`
          : 'No se pudo leer el archivo seleccionado.'
      ])
    }
  }

  const handleConfirmImport = async (): Promise<void> => {
    if (parsedRows.length === 0) return
    setIsProcessing(true)
    setImportProgress({ completed: 0, total: parsedRows.length })
    try {
      const result = await onImportBatch(parsedRows, (completed, total) =>
        setImportProgress({ completed, total })
      )
      setImportedCount(result.created)
      setParseErrors((errors) => [...errors, ...result.errors])
      setParsedRows([])
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Error al guardar productos en la base de datos.'
      setParseErrors([msg])
    } finally {
      setIsProcessing(false)
    }
  }

  const taxLabel = (taxId?: string): string => {
    const tax = taxes.find((item) => item.id === taxId)
    if (!tax) return 'Predeterminada'
    return formatTaxLabel(tax.name, tax.rate)
  }

  const brandLabel = (brandId?: string): string => {
    if (!brandId) return '-'
    const b = brands.find((item) => item.id === brandId)
    return b ? b.name : '-'
  }

  const supplierLabel = (supplierId?: string): string => {
    if (!supplierId) return '-'
    const s = suppliers.find((item) => item.id === supplierId)
    return s ? s.name : '-'
  }

  const typeLabel = (typeId?: string): string => {
    if (!typeId) return '-'
    const t = types.find((item) => item.id === typeId)
    return t ? t.name : '-'
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 text-xs">
      <div className="flex items-center justify-between gap-3 p-3 bg-blue-50 border border-blue-200 rounded-[6px]">
        <div>
          <p className="font-semibold text-blue-900">¿No tienes el formato requerido?</p>
          <p className="text-blue-700 text-[11px]">
            Descarga una plantilla Excel con formato, guía de llenado y una hoja lista para importar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleDownloadTemplate()}
          disabled={isDownloadingTemplate}
          className="px-3 py-1.5 bg-white border border-blue-300 text-blue-800 font-semibold rounded-[4px] hover:bg-blue-100 shrink-0 cursor-pointer disabled:opacity-50"
        >
          {isDownloadingTemplate ? 'Preparando…' : 'Descargar plantilla Excel'}
        </button>
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
          onChange={(event) => void handleFileSelect(event)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-6 border-2 border-dashed border-slate-300 hover:border-[#0067C0] rounded-[6px] bg-[#F9F9F9] hover:bg-blue-50/50 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Upload size={24} className="text-[#0067C0]" />
          <span className="font-semibold text-slate-700">
            Haz clic aquí para seleccionar un archivo Excel (.xlsx) o CSV
          </span>
          <span className="text-[10px] text-slate-400">
            Obligatorios: Codigo, Nombre y PrecioVenta · Impuestos, marcas, proveedores y tipos
            deben existir en sus catálogos
          </span>
        </button>
      </div>

      {taxesError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-[6px] text-amber-800 text-[11px]">
          No se pudo leer el catálogo de impuestos: {taxesError}
        </div>
      )}
      {brandsError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-[6px] text-amber-800 text-[11px]">
          No se pudo leer el catálogo de marcas: {brandsError}
        </div>
      )}
      {suppliersError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-[6px] text-amber-800 text-[11px]">
          No se pudo leer el catálogo de proveedores: {suppliersError}
        </div>
      )}
      {typesError && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-[6px] text-amber-800 text-[11px]">
          No se pudo leer el catálogo de tipos de producto: {typesError}
        </div>
      )}

      {importedCount !== null && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-300 rounded-[6px] text-[#107C41]">
          <Check size={18} />
          <span className="font-bold">
            ¡Se importaron exitosamente {importedCount} productos a la base de datos!
          </span>
        </div>
      )}

      {parseErrors.length > 0 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-[6px] text-red-700 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle size={15} />
            <span>Observaciones encontradas:</span>
          </div>
          {parseErrors.slice(0, 6).map((err, idx) => (
            <p key={idx} className="text-[11px]">
              • {err}
            </p>
          ))}
          {parseErrors.length > 6 && (
            <p className="text-[10px] text-red-600">
              … y {parseErrors.length - 6} observación(es) más.
            </p>
          )}
        </div>
      )}

      {parsedRows.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-bold text-slate-800">
              Previsualización ({parsedRows.length} productos detectados):
            </span>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmImport}
              className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-[#0067C0] hover:bg-[#0078D4] text-white font-bold rounded-[4px] shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Check size={14} />
              <span>
                {isProcessing
                  ? `Guardando ${importProgress.completed}/${importProgress.total}...`
                  : 'Confirmar e Importar'}
              </span>
            </button>
          </div>
          <div className="border border-slate-200 rounded-[4px] overflow-hidden">
            <div className="max-h-36 overflow-auto">
              <table className="w-full min-w-[760px] text-left text-[11px]">
                <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold">
                  <tr>
                    <th className="py-1 px-2">Código</th>
                    <th className="py-1 px-2">Nombre</th>
                    <th className="py-1 px-2">Categoría</th>
                    <th className="py-1 px-2 text-center">Marca</th>
                    <th className="py-1 px-2 text-center">Proveedor</th>
                    <th className="py-1 px-2 text-center">Tipo</th>
                    <th className="py-1 px-2 text-right">Costo</th>
                    <th className="py-1 px-2 text-right">Venta</th>
                    <th className="py-1 px-2 text-center">Stock</th>
                    <th className="py-1 px-2 text-center">Impuesto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {preview.items.map((r, idx) => (
                    <tr
                      key={(preview.page - 1) * preview.pageSize + idx}
                      className="hover:bg-slate-50"
                    >
                      <td className="py-1 px-2">{r.code}</td>
                      <td className="py-1 px-2 font-sans font-medium">{r.name}</td>
                      <td className="py-1 px-2 font-sans">{r.category}</td>
                      <td className="py-1 px-2 text-center font-sans">{brandLabel(r.brandId)}</td>
                      <td className="py-1 px-2 text-center font-sans">
                        {supplierLabel(r.supplierId)}
                      </td>
                      <td className="py-1 px-2 text-center font-sans">{typeLabel(r.typeId)}</td>
                      <td className="py-1 px-2 text-right">
                        {formatCurrency(r.costPrice, config.currency)}
                      </td>
                      <td className="py-1 px-2 text-right font-bold text-[#107C41]">
                        {formatCurrency(r.salePrice, config.currency)}
                      </td>
                      <td className="py-1 px-2 text-center">{r.stock}</td>
                      <td className="py-1 px-2 text-center font-sans">{taxLabel(r.taxId)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={preview.page}
              pageSize={preview.pageSize}
              totalItems={preview.totalItems}
              totalPages={preview.totalPages}
              onPageChange={preview.setPage}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductImportTab
