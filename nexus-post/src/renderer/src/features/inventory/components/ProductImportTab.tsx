import React, { useState, useRef } from 'react'
import type { ProductInput } from '@shared/contracts'
import { Upload, Check, AlertCircle } from '../../../shared/icons/Icons'

interface ProductImportTabProps {
  onImportBatch: (inputs: ProductInput[]) => Promise<number>
}

export const ProductImportTab: React.FC<ProductImportTabProps> = ({ onImportBatch }) => {
  const [parsedRows, setParsedRows] = useState<ProductInput[]>([])
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [importedCount, setImportedCount] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownloadTemplate = (): void => {
    const templateContent =
      '\uFEFF' +
      [
        'Codigo,Nombre,Categoria,PrecioCosto,PrecioVenta,Stock,StockMinimo,Unidad,Descripcion,TieneImpuesto,ImagenURL',
        '750100000001,Ejemplo Producto 1,Abarrotes y Despensa,15.50,22.00,50,10,Pieza (pza),Descripcion del producto,SI,https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300',
        '750100000002,Ejemplo Producto 2,Bebidas y Refrescos,10.00,16.50,100,20,Pieza (pza),Bebida refrescante,SI,'
      ].join('\r\n')

    const blob = new Blob([templateContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `plantilla_productos_nexuspos.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportedCount(null)
    setParseErrors([])

    const reader = new FileReader()
    reader.onload = () => {
      const text = reader.result as string
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)

      if (lines.length < 2) {
        setParseErrors(['El archivo no contiene filas de datos suficientes.'])
        return
      }

      const rows: ProductInput[] = []
      const errors: string[] = []

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) =>
          c.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
        )

        if (cols.length < 5) continue

        const code = cols[0]?.trim()
        const name = cols[1]?.trim()
        const category = cols[2]?.trim() || 'General'
        const costPrice = parseFloat(cols[3]) || 0
        const salePrice = parseFloat(cols[4]) || 0
        const stock = parseFloat(cols[5]) || 0
        const minStock = parseFloat(cols[6]) || 5
        const unit = cols[7]?.trim() || 'Pieza (pza)'
        const description = cols[8]?.trim() || ''
        const hasTax = (cols[9]?.toUpperCase() || 'SI').includes('SI')
        const imageUrl = cols[10]?.trim() || ''

        if (!code || !name) {
          errors.push(`Línea ${i + 1}: Código y Nombre son obligatorios.`)
          continue
        }

        rows.push({
          code,
          name,
          category,
          costPrice,
          salePrice,
          stock,
          minStock,
          unit,
          description,
          hasTax,
          imageUrl,
          active: true
        })
      }

      setParsedRows(rows)
      setParseErrors(errors)
    }

    reader.readAsText(file)
  }

  const handleConfirmImport = async (): Promise<void> => {
    if (parsedRows.length === 0) return
    setIsProcessing(true)
    try {
      const count = await onImportBatch(parsedRows)
      setImportedCount(count)
      setParsedRows([])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar productos en la base de datos.'
      setParseErrors([msg])
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="p-6 space-y-4 text-xs max-h-[60vh] overflow-y-auto">
      <div className="flex items-center justify-between gap-3 p-3 bg-blue-50 border border-blue-200 rounded-[6px]">
        <div>
          <p className="font-semibold text-blue-900">¿No tienes el formato requerido?</p>
          <p className="text-blue-700 text-[11px]">
            Descarga la plantilla oficial con ejemplos de columnas y tipos de datos.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="px-3 py-1.5 bg-white border border-blue-300 text-blue-800 font-semibold rounded-[4px] hover:bg-blue-100 shrink-0 cursor-pointer"
        >
          Descargar Plantilla
        </button>
      </div>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, text/csv, application/vnd.ms-excel"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full py-6 border-2 border-dashed border-slate-300 hover:border-[#0067C0] rounded-[6px] bg-[#F9F9F9] hover:bg-blue-50/50 flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Upload size={24} className="text-[#0067C0]" />
          <span className="font-semibold text-slate-700">
            Haz clic aquí para seleccionar el archivo CSV o Excel
          </span>
          <span className="text-[10px] text-slate-400">
            Columnas requeridas: Codigo, Nombre, Categoria, PrecioCosto, PrecioVenta, Stock
          </span>
        </button>
      </div>

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
          {parseErrors.slice(0, 4).map((err, idx) => (
            <p key={idx} className="text-[11px]">
              • {err}
            </p>
          ))}
        </div>
      )}

      {parsedRows.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800">
              Previsualización ({parsedRows.length} productos detectados):
            </span>
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleConfirmImport}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0067C0] hover:bg-[#0078D4] text-white font-bold rounded-[4px] shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Check size={14} />
              <span>{isProcessing ? 'Guardando en BD...' : 'Confirmar e Importar'}</span>
            </button>
          </div>
          <div className="border border-slate-200 rounded-[4px] overflow-hidden max-h-36 overflow-y-auto">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-100 text-slate-700 sticky top-0 font-semibold">
                <tr>
                  <th className="py-1 px-2">Código</th>
                  <th className="py-1 px-2">Nombre</th>
                  <th className="py-1 px-2">Categoría</th>
                  <th className="py-1 px-2 text-right">Costo</th>
                  <th className="py-1 px-2 text-right">Venta</th>
                  <th className="py-1 px-2 text-center">Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {parsedRows.slice(0, 10).map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-1 px-2">{r.code}</td>
                    <td className="py-1 px-2 font-sans font-medium">{r.name}</td>
                    <td className="py-1 px-2 font-sans">{r.category}</td>
                    <td className="py-1 px-2 text-right">${r.costPrice.toFixed(2)}</td>
                    <td className="py-1 px-2 text-right font-bold text-[#107C41]">
                      ${r.salePrice.toFixed(2)}
                    </td>
                    <td className="py-1 px-2 text-center">{r.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductImportTab
