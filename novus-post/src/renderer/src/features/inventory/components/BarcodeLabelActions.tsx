import React from 'react'
import { Download, Printer } from '../../../shared/icons/Icons'

interface BarcodeLabelActionsProps {
  copies: number
  canRun: boolean
  isPrinting: boolean
  isDownloadingPdf: boolean
  error: string | null
  message: string | null
  onClose: () => void
  onPrint: () => void
  onDownloadPdf: () => void
}

export const BarcodeLabelActions: React.FC<BarcodeLabelActionsProps> = ({
  copies,
  canRun,
  isPrinting,
  isDownloadingPdf,
  error,
  message,
  onClose,
  onPrint,
  onDownloadPdf
}) => (
  <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3.5 bg-[#f8f9fa] border-t border-slate-200">
    <span className="w-full sm:w-auto text-xs text-slate-500">
      Total: <strong className="text-slate-800">{copies} etiquetas</strong>
    </span>
    <div className="w-full sm:w-auto flex flex-wrap justify-end gap-2">
      {error && (
        <p className="w-full text-right text-[11px] text-red-600" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="w-full text-right text-[11px] text-emerald-700" role="status">
          {message}
        </p>
      )}
      <button
        type="button"
        onClick={onClose}
        className="px-3.5 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-sm hover:bg-slate-50"
      >
        Cerrar
      </button>
      <button
        type="button"
        onClick={onDownloadPdf}
        disabled={!canRun || isDownloadingPdf}
        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-[#0067C0] bg-white border border-[#0067C0] hover:bg-blue-50 rounded-sm disabled:opacity-50"
      >
        <Download size={15} />
        <span>{isDownloadingPdf ? 'Creando PDF…' : 'Descargar PDF'}</span>
      </button>
      <button
        type="button"
        onClick={onPrint}
        disabled={!canRun || isPrinting}
        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-[#0078D4] hover:bg-[#106EBE] rounded-sm disabled:opacity-50"
      >
        <Printer size={15} />
        <span>{isPrinting ? 'Enviando…' : 'Imprimir etiquetas'}</span>
      </button>
    </div>
  </div>
)

export default BarcodeLabelActions
