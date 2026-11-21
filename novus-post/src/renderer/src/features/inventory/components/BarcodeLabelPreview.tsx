import React from 'react'
import type { BarcodeFormat } from '@shared/contracts'
import { useBusinessConfig } from '../../../shared/hooks/useBusinessConfig'
import { formatCurrency } from '../../../shared/lib/currency'

interface BarcodeLabelPreviewProps {
  productName?: string
  salePrice?: number
  barcodeValue: string
  barcodeSvg: string
  barcodeFormat: BarcodeFormat
  widthMm: number
  heightMm: number
  includePrice: boolean
  isLoading: boolean
  error: string | null
}

export const BarcodeLabelPreview: React.FC<BarcodeLabelPreviewProps> = ({
  productName,
  salePrice,
  barcodeValue,
  barcodeSvg,
  barcodeFormat,
  widthMm,
  heightMm,
  includePrice,
  isLoading,
  error
}) => {
  const { config } = useBusinessConfig()
  return (
  <div className="flex flex-col items-center justify-center p-5 bg-slate-100 border border-dashed border-slate-300 rounded">
    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
      Vista previa de etiqueta ({widthMm} × {heightMm} mm)
    </span>
    <div
      className="bg-white border-2 border-slate-300 shadow-md p-3 flex flex-col items-center justify-between text-center select-none"
      style={{
        width: `${Math.min(240, widthMm * 4.5)}px`,
        minHeight: `${Math.min(150, heightMm * 4.5)}px`
      }}
    >
      <div className="text-[11px] font-bold text-slate-800 line-clamp-2 uppercase">
        {productName}
      </div>
      <div className="my-2 flex flex-col items-center">
        {isLoading ? (
          <div className="h-12 w-36 flex items-center justify-center gap-1 animate-pulse">
            {Array.from({ length: 16 }, (_, i) => (
              <div
                key={i}
                className="bg-slate-300 h-10 rounded-[1px]"
                style={{ width: i % 3 === 0 ? '4px' : '2px' }}
              />
            ))}
          </div>
        ) : barcodeSvg ? (
          <img
            src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(barcodeSvg)}`}
            alt={`Código de barras ${barcodeValue}`}
            className="max-w-full h-12 object-contain"
          />
        ) : (
          <span className="h-12 flex items-center text-[10px] text-slate-400">
            Vista previa no disponible
          </span>
        )}
        <span className="font-mono text-[10px] tracking-widest text-slate-800 mt-1">
          {isLoading ? (
            <span className="inline-block w-24 h-2.5 bg-slate-200 rounded-[2px] animate-pulse" />
          ) : (
            barcodeValue
          )}
        </span>
      </div>
      {includePrice && (
        <div className="text-sm font-extrabold font-tabular text-[#0078D4]">
          {salePrice === undefined ? '' : formatCurrency(salePrice, config.currency)}
        </div>
      )}
    </div>
    <span className="text-[10px] text-slate-400 mt-3 font-mono">
      Código real · {widthMm} × {heightMm} mm · {barcodeFormat}
    </span>
    {error && (
      <span className="mt-2 text-[10px] text-red-600" role="alert">
        {error}
      </span>
    )}
  </div>
  )
}

export default BarcodeLabelPreview
