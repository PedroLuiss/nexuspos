import React from 'react'
import type { BarcodeFormat, ProductBarcode } from '@shared/contracts'

interface BarcodeLabelControlsProps {
  productCode?: string
  barcodes: ProductBarcode[]
  selectedBarcodeId?: string
  barcodeFormat: BarcodeFormat
  widthMm: number
  heightMm: number
  marginMm: number
  copies: number
  includePrice: boolean
  isLoading: boolean
  loadError: string | null
  onBarcodeChange: (id: string) => void
  onWidthChange: (value: number) => void
  onHeightChange: (value: number) => void
  onMarginChange: (value: number) => void
  onCopiesChange: (value: number) => void
  onIncludePriceChange: (value: boolean) => void
}

export const BarcodeLabelControls: React.FC<BarcodeLabelControlsProps> = ({
  productCode,
  barcodes,
  selectedBarcodeId,
  barcodeFormat,
  widthMm,
  heightMm,
  marginMm,
  copies,
  includePrice,
  isLoading,
  loadError,
  onBarcodeChange,
  onWidthChange,
  onHeightChange,
  onMarginChange,
  onCopiesChange,
  onIncludePriceChange
}) => (
  <div className="space-y-3.5 text-xs">
    <div>
      <label className="block font-medium text-slate-700 mb-1">Código a generar</label>
      <select
        value={selectedBarcodeId ?? ''}
        onChange={(event) => onBarcodeChange(event.target.value)}
        disabled={isLoading || barcodes.length === 0}
        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-sm disabled:bg-slate-100"
      >
        {barcodes.length === 0 ? (
          <option value="">Usar código del producto: {productCode ?? '—'}</option>
        ) : (
          barcodes.map((barcode) => (
            <option key={barcode.id} value={barcode.id}>
              {barcode.label ? `${barcode.label} · ` : ''}
              {barcode.barcode} ({barcode.format})
              {barcode.isPrimary ? ' · Principal' : ''}
            </option>
          ))
        )}
      </select>
      {barcodes.length === 0 && (
        <p className="mt-1 text-[10px] text-slate-500">
          No hay códigos activos guardados; se generará el código del producto en Code128.
        </p>
      )}
      {loadError && (
        <p className="mt-1 text-[10px] text-red-600" role="alert">
          No se pudo cargar el catálogo de códigos: {loadError}
        </p>
      )}
    </div>

    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className="block font-medium text-slate-700 mb-1">Simbología</label>
        <input
          type="text"
          readOnly
          value={barcodeFormat}
          className="w-full px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-sm"
        />
      </div>
      <p className="col-span-2 self-end text-[10px] text-slate-500">
        La impresora y el papel se seleccionan en el diálogo de Windows.
      </p>
    </div>

    <div className="grid grid-cols-3 gap-2">
      <label className="block font-medium text-slate-700">
        Ancho (mm)
        <input
          type="number"
          min="20"
          max="100"
          value={widthMm}
          onChange={(event) => onWidthChange(Number(event.target.value))}
          className="mt-1 w-full px-2 py-1 bg-white border border-slate-300 rounded-sm font-tabular text-center"
        />
      </label>
      <label className="block font-medium text-slate-700">
        Alto (mm)
        <input
          type="number"
          min="10"
          max="100"
          value={heightMm}
          onChange={(event) => onHeightChange(Number(event.target.value))}
          className="mt-1 w-full px-2 py-1 bg-white border border-slate-300 rounded-sm font-tabular text-center"
        />
      </label>
      <label className="block font-medium text-slate-700">
        Margen (mm)
        <input
          type="number"
          min="0"
          max={Math.max(0, Math.floor(Math.min(widthMm, heightMm) / 2) - 1)}
          value={marginMm}
          onChange={(event) => onMarginChange(Number(event.target.value))}
          className="mt-1 w-full px-2 py-1 bg-white border border-slate-300 rounded-sm font-tabular text-center"
        />
      </label>
    </div>

    <div className="grid grid-cols-2 gap-3 pt-2">
      <label className="block font-medium text-slate-700">
        Cantidad de etiquetas
        <input
          type="number"
          min="1"
          max="500"
          value={copies}
          onChange={(event) =>
            onCopiesChange(event.target.value === '' ? 0 : Number(event.target.value))
          }
          className="mt-1 w-full px-2 py-1 bg-white border border-slate-300 rounded-sm font-tabular"
        />
      </label>
      <label className="flex items-center gap-2 pt-5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={includePrice}
          onChange={(event) => onIncludePriceChange(event.target.checked)}
          className="rounded text-[#0078D4]"
        />
        <span>Mostrar precio</span>
      </label>
    </div>
  </div>
)

export default BarcodeLabelControls
