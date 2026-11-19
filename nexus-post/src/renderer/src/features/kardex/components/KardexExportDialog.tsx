import React, { useState } from 'react'
import type { KardexExportFormat, KardexMovementQuery } from '@shared/contracts'
import { Download, FileSpreadsheet, FileText, Loader2 } from '../../../shared/icons/Icons'
import { Modal } from '../../../shared/ui/Modal'
import { kardexErrorMessage } from '../api/kardex.api'

interface KardexExportDialogProps {
  query: KardexMovementQuery
  onClose: () => void
  onExport: (format: KardexExportFormat) => Promise<boolean>
}

const FORMAT_OPTIONS: Array<{
  value: KardexExportFormat
  title: string
  description: string
  extension: string
  Icon: typeof FileSpreadsheet
}> = [
  {
    value: 'XLSX',
    title: 'Excel',
    description: 'Libro con tabla filtrable y hoja de resumen.',
    extension: '.xlsx',
    Icon: FileSpreadsheet
  },
  {
    value: 'PDF',
    title: 'PDF',
    description: 'Reporte imprimible en A3 horizontal.',
    extension: '.pdf',
    Icon: FileText
  }
]

function getFilterDescription(query: KardexMovementQuery): string {
  const period = {
    WEEK: 'Semana actual',
    MONTH: 'Mes actual',
    YEAR: 'Año actual',
    ALL: 'Todo el historial'
  }[query.period]
  const type = query.type === 'ALL' ? 'todos los tipos' : query.type.toLowerCase()
  const reason = query.reason === 'ALL' ? 'todos los motivos' : query.reason.replace(/_/g, ' ')
  const search = query.search ? ` · búsqueda «${query.search}»` : ''
  return `${period} · ${type} · ${reason}${search}`
}

export const KardexExportDialog: React.FC<KardexExportDialogProps> = ({
  query,
  onClose,
  onExport
}) => {
  const [format, setFormat] = useState<KardexExportFormat>('XLSX')
  const [isExporting, setIsExporting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'cancelled' | 'error'>('success')

  const handleExport = async (): Promise<void> => {
    setIsExporting(true)
    setMessage(null)
    try {
      const saved = await onExport(format)
      setMessage(saved ? 'Archivo guardado correctamente.' : 'Exportación cancelada.')
      setMessageType(saved ? 'success' : 'cancelled')
    } catch (error: unknown) {
      setMessage(kardexErrorMessage(error))
      setMessageType('error')
    } finally {
      setIsExporting(false)
    }
  }

  const close = (): void => {
    if (!isExporting) onClose()
  }

  return (
    <Modal
      isOpen
      onClose={close}
      title="Exportar Kardex"
      width="max-w-xl"
      footer={
        <>
          <button
            type="button"
            onClick={close}
            disabled={isExporting}
            className="rounded-[4px] border border-[#D1D1D1] bg-white px-3 py-1.5 text-xs font-semibold text-[#1B1B1B] hover:bg-[#F3F3F3] disabled:opacity-50"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => void handleExport()}
            disabled={isExporting}
            className="flex items-center gap-1.5 rounded-[4px] bg-[#0067C0] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#005A9E] disabled:opacity-60"
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            {isExporting
              ? 'Preparando archivo…'
              : `Exportar ${format === 'XLSX' ? 'Excel' : 'PDF'}`}
          </button>
        </>
      }
    >
      <p className="text-xs leading-relaxed text-[#5C5C5C]">
        Se exportarán todos los movimientos que coincidan con los filtros, no solo la página
        visible.
      </p>
      <div className="mt-2 rounded-[4px] border border-[#D9E2F0] bg-[#F2F6FA] px-3 py-2 text-[11px] text-[#526579]">
        <strong className="text-[#263445]">Filtros:</strong> {getFilterDescription(query)}
      </div>

      <fieldset className="mt-4 grid gap-2 sm:grid-cols-2">
        <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-[#5C5C5C]">
          Selecciona el formato
        </legend>
        {FORMAT_OPTIONS.map(({ value, title, description, extension, Icon }) => (
          <label
            key={value}
            className={`flex cursor-pointer gap-3 rounded-[6px] border p-3 transition-colors ${
              format === value
                ? 'border-[#0067C0] bg-blue-50'
                : 'border-[#D1D1D1] bg-white hover:bg-[#F9F9F9]'
            }`}
          >
            <input
              type="radio"
              name="kardex-export-format"
              value={value}
              checked={format === value}
              onChange={() => {
                setFormat(value)
                setMessage(null)
                setMessageType('success')
              }}
              disabled={isExporting}
              className="mt-1 accent-[#0067C0]"
            />
            <Icon size={20} className={value === 'XLSX' ? 'text-[#107C41]' : 'text-[#C42B1C]'} />
            <span>
              <span className="block text-sm font-bold text-[#1B1B1B]">
                {title}{' '}
                <span className="font-mono text-xs font-normal text-[#717783]">{extension}</span>
              </span>
              <span className="mt-1 block text-[11px] leading-relaxed text-[#717783]">
                {description}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      {message && (
        <div
          role={messageType === 'error' ? 'alert' : 'status'}
          className={`mt-3 rounded-[4px] border px-3 py-2 text-xs ${
            messageType === 'error'
              ? 'border-red-200 bg-red-50 text-[#C42B1C]'
              : messageType === 'cancelled'
                ? 'border-[#D1D1D1] bg-[#F9F9F9] text-[#5C5C5C]'
                : 'border-emerald-200 bg-emerald-50 text-[#107C41]'
          }`}
        >
          {message}
        </div>
      )}
    </Modal>
  )
}
