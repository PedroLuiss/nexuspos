import React, { useState } from 'react'
import { Product } from '../../../shared/types/domain'
import { Barcode, Printer, X, Check, SlidersHorizontal } from '../../../shared/icons/Icons'

interface BarcodeGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
}

export const BarcodeGeneratorModal: React.FC<BarcodeGeneratorModalProps> = ({
  isOpen,
  onClose,
  products
}) => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '')
  const [barcodeFormat, setBarcodeFormat] = useState<'EAN-13' | 'Code128'>('EAN-13')
  const [dpi, setDpi] = useState<number>(300)
  const [widthMm, setWidthMm] = useState<number>(50)
  const [heightMm, setHeightMm] = useState<number>(30)
  const [marginMm, setMarginMm] = useState<number>(3)
  const [copies, setCopies] = useState<number>(10)
  const [includePrice, setIncludePrice] = useState<boolean>(true)

  if (!isOpen) return null

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-backdrop">
      <div className="w-full max-w-2xl bg-white rounded-md shadow-2xl border border-slate-200 overflow-hidden animate-modal">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#f8f9fa] border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#0078D4]/10 text-[#0078D4] flex items-center justify-center">
              <Barcode size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Generador de Etiquetas y Códigos de Barras
              </h2>
              <p className="text-[11px] text-slate-500">
                Configuración de dimensiones térmicas para impresoras de etiquetas (Zebra / Xprinter)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content: 2 Columns (Config Left, Preview Right) */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
          {/* Settings Left */}
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Seleccionar Producto
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm focus:border-[#0078D4]"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Simbología</label>
                <select
                  value={barcodeFormat}
                  onChange={(e) => setBarcodeFormat(e.target.value as any)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-sm"
                >
                  <option value="EAN-13">EAN-13 (Comercial)</option>
                  <option value="Code128">Code 128 (Alfanumérico)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Resolución (DPI)</label>
                <select
                  value={dpi}
                  onChange={(e) => setDpi(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-sm"
                >
                  <option value={203}>203 DPI (Estándar)</option>
                  <option value={300}>300 DPI (Alta resolución)</option>
                  <option value={600}>600 DPI (Ultra fino)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Ancho (mm)</label>
                <input
                  type="number"
                  value={widthMm}
                  onChange={(e) => setWidthMm(Number(e.target.value))}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-sm font-tabular text-center"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Alto (mm)</label>
                <input
                  type="number"
                  value={heightMm}
                  onChange={(e) => setHeightMm(Number(e.target.value))}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-sm font-tabular text-center"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Margen (mm)</label>
                <input
                  type="number"
                  value={marginMm}
                  onChange={(e) => setMarginMm(Number(e.target.value))}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-sm font-tabular text-center"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Nº Copias a Imprimir</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={copies}
                  onChange={(e) => setCopies(Number(e.target.value))}
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-sm font-tabular"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includePrice}
                    onChange={(e) => setIncludePrice(e.target.checked)}
                    className="rounded text-[#0078D4]"
                  />
                  <span>Mostrar precio</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Live Sticker Preview */}
          <div className="flex flex-col items-center justify-center p-5 bg-slate-100 border border-dashed border-slate-300 rounded">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Vista Previa de Etiqueta ({widthMm}x{heightMm}mm)
            </span>

            {/* Sticker physical mock */}
            <div
              className="bg-white border-2 border-slate-300 shadow-md p-3 flex flex-col items-center justify-between text-center select-none"
              style={{
                width: `${Math.min(240, widthMm * 4.5)}px`,
                minHeight: `${Math.min(150, heightMm * 4.5)}px`
              }}
            >
              <div className="text-[11px] font-bold text-slate-800 line-clamp-2 uppercase">
                {selectedProduct?.name}
              </div>

              {/* Simulated SVG Barcode */}
              <div className="my-2 flex flex-col items-center">
                <div className="flex items-center h-10 gap-[2px]">
                  {[1, 2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 2, 1, 3, 2, 4, 1, 2, 3, 1, 2].map((w, i) => (
                    <div
                      key={i}
                      className="bg-black h-full"
                      style={{ width: `${Math.max(1, w * 1.3)}px` }}
                    />
                  ))}
                </div>
                <span className="font-mono text-[10px] tracking-widest text-slate-800 mt-1">
                  {selectedProduct?.code}
                </span>
              </div>

              {includePrice && (
                <div className="text-sm font-extrabold font-tabular text-[#0078D4]">
                  ${selectedProduct?.salePrice.toFixed(2)}
                </div>
              )}
            </div>

            <span className="text-[10px] text-slate-400 mt-3 font-mono">
              Driver térmico: ESC/POS / ZPL II @ {dpi} DPI
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-[#f8f9fa] border-t border-slate-200">
          <span className="text-xs text-slate-500">
            Total a imprimir: <strong className="text-slate-800">{copies} etiquetas</strong>
          </span>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-sm hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                alert(`Enviando ${copies} etiquetas a la cola de impresión térmica...`)
                onClose()
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#0078D4] hover:bg-[#106EBE] rounded-sm shadow-xs"
            >
              <Printer size={15} />
              <span>Imprimir Lote [ENTER]</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BarcodeGeneratorModal
